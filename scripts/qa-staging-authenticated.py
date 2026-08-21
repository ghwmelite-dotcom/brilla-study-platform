import json
import os
from pathlib import Path
import secrets
import subprocess
import time
import tomllib
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DEPLOYMENTS = json.loads((ROOT / "config" / "deployments.json").read_text(encoding="utf-8"))
STAGING = DEPLOYMENTS["staging"]
API_URL = f"{STAGING['apiOrigin']}/api"
PAGES_URL = STAGING["pagesOrigin"]
DATABASE = STAGING["database"]
SCREENSHOT_DIR = ROOT / "artifacts"

EXPECTED_STAGING = {
    "apiOrigin": "https://brilla-api-staging.ghwmelite.workers.dev",
    "pagesOrigin": "https://whiteboard-staging.brilla-study-platform.pages.dev",
    "database": "brilla-db-staging",
    "databaseId": "1faeca41-2233-4a0b-a273-0d3aadba9c96",
}


def validate_staging_target() -> None:
    """Fail closed before any remote request or write can reach production."""
    if STAGING != EXPECTED_STAGING:
        raise RuntimeError("Staging deployment manifest does not match the approved isolated target")

    wrangler = tomllib.loads((ROOT / "wrangler.toml").read_text(encoding="utf-8"))
    production_db = wrangler["d1_databases"][0]
    staging_db = wrangler["env"]["staging"]["d1_databases"][0]
    production_manifest = DEPLOYMENTS["production"]

    if (
        production_db["database_name"] != production_manifest["database"]
        or production_db["database_id"] != production_manifest["databaseId"]
        or staging_db["database_name"] != EXPECTED_STAGING["database"]
        or staging_db["database_id"] != EXPECTED_STAGING["databaseId"]
    ):
        raise RuntimeError("Wrangler database bindings do not match the deployment manifest")

    if (
        staging_db["database_name"] == production_db["database_name"]
        or staging_db["database_id"] == production_db["database_id"]
        or STAGING["apiOrigin"] == production_manifest["apiOrigin"]
        or STAGING["pagesOrigin"] == production_manifest["pagesOrigin"]
    ):
        raise RuntimeError("Staging target is not isolated from production")


def create_synthetic_whiteboard_png() -> str:
    """Render a real 1200x800 PNG so vision QA exercises meaningful input."""
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page(viewport={"width": 1200, "height": 800})
            page.set_content('<canvas id="board" width="1200" height="800"></canvas>')
            data_url = page.evaluate("""
                () => {
                  const canvas = document.getElementById('board');
                  const ctx = canvas.getContext('2d');
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, 1200, 800);
                  ctx.fillStyle = '#1e40af';
                  ctx.font = 'bold 42px sans-serif';
                  ctx.fillText('Synthetic QA: Solve 2x + 4 = 10', 100, 120);
                  ctx.fillStyle = '#111827';
                  ctx.font = '32px sans-serif';
                  ctx.fillText('2x = 6', 180, 280);
                  ctx.fillText('x = 3', 180, 360);
                  ctx.strokeStyle = '#7c3aed';
                  ctx.lineWidth = 5;
                  ctx.strokeRect(150, 315, 180, 70);
                  return canvas.toDataURL('image/png');
                }
            """)
            return data_url.split(',', 1)[1]
        finally:
            browser.close()


def request_json(
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
    token: str | None = None,
    timeout: int = 90,
    qa_sentinel: str | None = None,
) -> tuple[int, dict[str, Any]]:
    headers = {
        "Content-Type": "application/json",
        "Origin": PAGES_URL,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if qa_sentinel:
        headers["X-Brilla-QA-Sentinel"] = qa_sentinel
    request = Request(
        f"{API_URL}{path}",
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        payload = error.read().decode("utf-8")
        try:
            return error.code, json.loads(payload) if payload else {}
        except ValueError:
            return error.code, {"edge_response": payload[:300]}


def require(checks: list[dict[str, Any]], name: str, condition: bool, detail: Any) -> None:
    checks.append({"name": name, "passed": bool(condition), "detail": detail})
    if not condition:
        raise AssertionError(f"{name} failed: {detail}")


def run_staging_sql(sql: str) -> None:
    result = subprocess.run(
        [
            "npx.cmd",
            "wrangler",
            "d1",
            "execute",
            DATABASE,
            "--env",
            "staging",
            "--remote",
            "--command",
            sql,
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        env={**os.environ, "NO_COLOR": "1"},
    )
    if result.returncode != 0:
        raise RuntimeError("Staging D1 operation failed")

def query_staging_sql(sql: str) -> list[dict[str, Any]]:
    result = subprocess.run(
        [
            "npx.cmd",
            "wrangler",
            "d1",
            "execute",
            DATABASE,
            "--env",
            "staging",
            "--remote",
            "--command",
            sql,
            "--json",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        env={**os.environ, "NO_COLOR": "1"},
    )
    if result.returncode != 0:
        raise RuntimeError("Staging D1 query failed")
    payload = json.loads(result.stdout)
    return payload[0].get("results", []) if payload else []

def verify_staging_migration_ledger() -> None:
    rows = query_staging_sql("SELECT name FROM d1_migrations ORDER BY id;")
    remote_names = [row.get("name") for row in rows]
    local_names = sorted(path.name for path in (ROOT / "database" / "migrations").glob("*.sql"))
    if remote_names != local_names or "098_ai_answer_cache.sql" not in remote_names:
        raise RuntimeError("Staging migration ledger is not current through migration 098")


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    validate_staging_target()
    verify_staging_migration_ledger()
    checks: list[dict[str, Any]] = []
    run_id = f"{int(time.time())}-{secrets.token_hex(4)}"
    sentinel = f"qa-sentinel-{secrets.token_hex(16)}"
    screenshot = SCREENSHOT_DIR / f"staging-my-plan-authenticated-{run_id}.png"
    qa_topic_id = f"topic_qa_{run_id.replace('-', '_')}"
    student_email = f"qa-student-{run_id}@example.invalid"
    teacher_email = f"qa-teacher-{run_id}@example.invalid"
    student_password = secrets.token_urlsafe(24) + "A1!"
    teacher_password = secrets.token_urlsafe(24) + "B2!"
    student_token = ""
    teacher_token = ""
    student_user: dict[str, Any] = {}

    run_staging_sql(
        "INSERT INTO rate_limits (identifier, endpoint, request_count, window_start) VALUES ("
        f"{sql_literal(sentinel)}, 'qa-deployment-sentinel', 1, datetime('now'));"
    )
    try:
        status, payload = request_json("GET", f"/health/staging-target/{sentinel}")
    except Exception:
        run_staging_sql(
            "DELETE FROM rate_limits "
            f"WHERE identifier={sql_literal(sentinel)} AND endpoint='qa-deployment-sentinel';"
        )
        raise
    sentinel_verified = (
        status == 200
        and payload.get("success") is True
        and payload.get("data", {}).get("verified") is True
    )
    if not sentinel_verified:
        run_staging_sql(
            "DELETE FROM rate_limits "
            f"WHERE identifier={sql_literal(sentinel)} AND endpoint='qa-deployment-sentinel';"
        )
    require(
        checks,
        "deployed_worker_staging_d1_verified",
        sentinel_verified,
        {"status": status, "verified": payload.get("data", {}).get("verified")},
    )
    synthetic_whiteboard_png = create_synthetic_whiteboard_png()

    try:
        for role, email, password in (
            ("student", student_email, student_password),
            ("teacher", teacher_email, teacher_password),
        ):
            body: dict[str, Any] = {
                "email": email,
                "password": password,
                "name": f"Staging QA {role.title()}",
                "role": role,
                "selectedTierId": "tier_free",
            }
            if role == "student":
                body.update(
                    {
                        "schoolLevel": "shs",
                        "yearGroup": 2,
                        "examTypeIds": ["exam_nsmq"],
                        "primaryExamTypeId": "exam_nsmq",
                    }
                )
            status, payload = request_json("POST", "/auth/register", body, qa_sentinel=sentinel)
            require(
                checks,
                f"{role}_registration_pending",
                status == 200
                and payload.get("success") is True
                and payload.get("data", {}).get("status") == "pending",
                {
                    "status": status,
                    "pending": payload.get("data", {}).get("status"),
                    "edge_response": payload.get("edge_response"),
                },
            )

        status, payload = request_json(
            "POST", "/auth/login", {"email": student_email, "password": student_password}
        )
        require(
            checks,
            "pending_login_denied",
            status == 401 and payload.get("success") is False,
            {"status": status},
        )

        run_staging_sql(
            "UPDATE users SET status='approved', email_verified=1, is_active=1 "
            f"WHERE email IN ({sql_literal(student_email)}, {sql_literal(teacher_email)});"
        )

        status, payload = request_json(
            "POST", "/auth/login", {"email": student_email, "password": student_password}
        )
        require(checks, "student_login", status == 200 and payload.get("success") is True, {"status": status})
        student_token = payload["data"]["token"]
        student_user = payload["data"]["user"]

        status, payload = request_json(
            "POST", "/auth/login", {"email": teacher_email, "password": teacher_password}
        )
        require(checks, "teacher_login", status == 200 and payload.get("success") is True, {"status": status})
        teacher_token = payload["data"]["token"]

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 1100})
            onboarding_auth_state = {
                "state": {
                    "user": student_user,
                    "token": student_token,
                    "isAuthenticated": True,
                },
                "version": 3,
            }
            context.add_init_script(
                "localStorage.setItem('brilla_token', " + json.dumps(student_token) + ");"
                "localStorage.setItem('brilla-auth', " + json.dumps(json.dumps(onboarding_auth_state)) + ");"
                "sessionStorage.setItem('brilla_splash_shown', 'true');"
            )
            page = context.new_page()
            onboarding_console_errors: list[str] = []
            onboarding_failed_requests: list[str] = []
            onboarding_http_errors: list[dict[str, Any]] = []
            page.on(
                "console",
                lambda message: onboarding_console_errors.append(message.text)
                if message.type == "error"
                else None,
            )
            page.on("pageerror", lambda error: onboarding_console_errors.append(str(error)))
            page.on(
                "requestfailed",
                lambda request: onboarding_failed_requests.append(request.url),
            )
            page.on(
                "response",
                lambda response: onboarding_http_errors.append(
                    {"url": response.url, "status": response.status}
                )
                if response.status >= 400 else None,
            )
            response = page.goto(f"{PAGES_URL}/dashboard", wait_until="networkidle")
            dialog = page.get_by_role("dialog", name="Counselor Brie")
            dialog.wait_for(timeout=30000)
            notice_visible = dialog.get_by_text("Brie is an AI academic guide", exact=False).is_visible()
            require(
                checks,
                "automatic_onboarding_wizard_visible",
                response is not None
                and response.status == 200
                and dialog.is_visible()
                and notice_visible,
                {"document_status": response.status if response else None, "notice": notice_visible},
            )
            page.get_by_role("button", name="Close Counselor Brie").click()
            require(
                checks,
                "automatic_onboarding_browser_clean",
                not onboarding_failed_requests and not onboarding_console_errors and not onboarding_http_errors,
                {
                    "failed_requests": onboarding_failed_requests,
                    "console_errors": onboarding_console_errors[:3],
                    "http_errors": onboarding_http_errors,
                },
            )
            browser.close()

        status, payload = request_json("GET", "/rewards/wheel/status", token=student_token)
        require(
            checks,
            "student_reward_wheel_status",
            status == 200 and payload.get("success") is True,
            {"status": status},
        )
        status, payload = request_json("GET", "/activity/friends", token=student_token)
        require(
            checks,
            "fresh_student_activity_feed",
            status == 200 and payload.get("success") is True,
            {"status": status},
        )
        status, _ = request_json("GET", "/guidance/goals", token=student_token)
        require(checks, "student_guidance_allowed", status == 200, {"status": status})
        status, _ = request_json("GET", "/guidance/goals", token=teacher_token)
        require(checks, "teacher_guidance_denied", status == 403, {"status": status})
        status, _ = request_json("GET", "/counselor/conversations")
        require(checks, "anonymous_counselor_denied", status == 401, {"status": status})
        status, payload = request_json("GET", "/counselor/conversations", token=student_token)
        require(
            checks,
            "student_counselor_allowed",
            status == 200 and payload.get("success") is True,
            {"status": status},
        )
        status, _ = request_json("GET", "/counselor/conversations", token=teacher_token)
        require(checks, "teacher_counselor_read_denied", status == 403, {"status": status})
        status, _ = request_json(
            "POST",
            "/counselor/conversations",
            {"counselorType": "academic", "title": "Denied synthetic staging QA"},
            teacher_token,
        )
        require(checks, "teacher_counselor_write_denied", status == 403, {"status": status})


        status, payload = request_json(
            "POST",
            "/guidance/goals",
            {"examType": "nsmq", "subjectId": "subj_nsmq_math"},
            student_token,
        )
        require(checks, "goal_saved", status == 200 and payload.get("success") is True, {"status": status})

        status, payload = request_json(
            "POST",
            "/guidance/assessment/start",
            {"examType": "nsmq", "subjectId": "subj_nsmq_math"},
            student_token,
        )
        require(checks, "assessment_started", status == 200 and payload.get("success") is True, {"status": status})
        assessment = payload["data"]
        for ordinal in range(15):
            question = assessment.get("nextQuestion")
            if not question:
                break
            status, payload = request_json(
                "POST",
                f"/guidance/assessment/{assessment['sessionId']}/answer",
                {
                    "questionId": question["id"],
                    "answer": "0",
                    "version": assessment["version"],
                    "timeTaken": 1,
                    "idempotencyKey": f"staging-{run_id}-{ordinal}",
                },
                student_token,
            )
            require(
                checks,
                f"assessment_answer_{ordinal + 1}",
                status == 200 and payload.get("success") is True,
                {"status": status},
            )
            assessment = {
                **assessment,
                **payload["data"],
                "sessionId": assessment["sessionId"],
            }
            if payload["data"].get("done"):
                break
        require(checks, "assessment_completed", bool(assessment.get("done")), {"asked": assessment.get("askedSoFar")})

        status, payload = request_json(
            "GET",
            "/guidance/plan?examType=nsmq&subjectId=subj_nsmq_math",
            token=student_token,
        )
        plan = payload.get("data", {}).get("plan", {})
        require(
            checks,
            "study_plan_generated",
            status == 200 and payload.get("success") is True and bool(plan),
            {"status": status, "has_plan": bool(plan)},
        )

        status, _ = request_json(
            "POST",
            "/guidance/plan/regenerate",
            {"examType": "nsmq", "subjectId": "subj_nsmq_math"},
            student_token,
        )
        require(checks, "free_plan_regenerate_gated", status == 403, {"status": status})

        run_staging_sql(
            "INSERT INTO topics (id, subject_id, name, slug, description) VALUES ("
            f"{sql_literal(qa_topic_id)}, 'subj_nsmq_math', "
            f"{sql_literal('Synthetic QA ' + run_id)}, {sql_literal('synthetic-qa-' + run_id)}, "
            "'Run-scoped live AI verification topic');"
        )

        status, payload = request_json(
            "POST",
            "/revision-classroom/sessions",
            {
                "examType": "nsmq",
                "subjectId": "subj_nsmq_math",
                "topicId": qa_topic_id,
                "sessionType": "topic_revision",
            },
            student_token,
        )
        require(checks, "revision_session_created", status == 200 and payload.get("success") is True, {"status": status})
        lesson_id = payload["data"]["lessons"][0]["id"]

        status, _ = request_json(
            "POST",
            f"/revision-classroom/lessons/{lesson_id}/whiteboard-teach",
            {"lessonType": "step-by-step"},
            student_token,
        )
        require(checks, "free_whiteboard_gated", status == 403, {"status": status})

        run_staging_sql(
            "UPDATE users SET trial_expires_at=datetime('now', '+2 days') "
            f"WHERE email={sql_literal(student_email)};"
        )

        status, payload = request_json(
            "POST",
            "/guidance/plan/regenerate",
            {"examType": "nsmq", "subjectId": "subj_nsmq_math"},
            student_token,
        )
        require(
            checks,
            "premium_plan_regenerate_allowed",
            status == 200 and payload.get("success") is True,
            {"status": status},
        )

        status, payload = request_json(
            "POST",
            f"/revision-classroom/lessons/{lesson_id}/whiteboard-teach",
            {"lessonType": "step-by-step"},
            student_token,
            timeout=180,
        )
        require(
            checks,
            "premium_whiteboard_teach",
            status == 200
            and payload.get("success") is True
            and payload.get("data", {}).get("fallback") is False
            and payload.get("data", {}).get("cached") is False,
            {"status": status, "fallback": payload.get("data", {}).get("fallback"), "cached": payload.get("data", {}).get("cached")},
        )

        outline = payload.get("data", {}).get("outline", [])
        status, payload = request_json(
            "POST",
            f"/revision-classroom/lessons/{lesson_id}/whiteboard-teach",
            {"lessonType": "step-by-step", "stepIndex": 1, "outline": outline},
            student_token,
            timeout=180,
        )
        require(
            checks,
            "premium_whiteboard_dedicated_step",
            status == 200
            and payload.get("success") is True
            and payload.get("data", {}).get("stepIndex") == 1
            and payload.get("data", {}).get("fallback") is False
            and payload.get("data", {}).get("cached") is False,
            {
                "status": status,
                "fallback": payload.get("data", {}).get("fallback"),
                "cached": payload.get("data", {}).get("cached"),
            },
        )

        status, payload = request_json(
            "POST",
            f"/revision-classroom/lessons/{lesson_id}/check-work",
            {
                "imageBase64": synthetic_whiteboard_png,
                "imageWidth": 1200,
                "imageHeight": 800,
                "stepIndex": 0,
            },
            student_token,
            timeout=180,
        )
        require(
            checks,
            "premium_check_work",
            status == 200
            and payload.get("success") is True
            and payload.get("data", {}).get("fallback") is False,
            {"status": status, "fallback": payload.get("data", {}).get("fallback")},
        )

        status, payload = request_json(
            "POST",
            f"/revision-classroom/lessons/{lesson_id}/ask-about",
            {
                "imageBase64": synthetic_whiteboard_png,
                "x": 240,
                "y": 350,
                "question": "Explain the boxed synthetic answer.",
            },
            student_token,
            timeout=180,
        )
        require(
            checks,
            "premium_ask_about",
            status == 200
            and payload.get("success") is True
            and payload.get("data", {}).get("fallback") is False,
            {"status": status, "fallback": payload.get("data", {}).get("fallback")},
        )

        status, payload = request_json(
            "POST",
            "/counselor/conversations",
            {"counselorType": "academic", "title": "Synthetic staging QA"},
            student_token,
        )
        require(
            checks,
            "counselor_conversation_created",
            status == 200 and payload.get("success") is True,
            {"status": status},
        )

        screenshot.parent.mkdir(parents=True, exist_ok=True)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1440, "height": 1100})
            auth_state = {
                "state": {
                    "user": student_user,
                    "token": student_token,
                    "isAuthenticated": True,
                },
                "version": 3,
            }
            context.add_init_script(
                "localStorage.setItem('brilla_token', " + json.dumps(student_token) + ");"
                "localStorage.setItem('brilla-auth', " + json.dumps(json.dumps(auth_state)) + ");"
                "sessionStorage.setItem('brilla_splash_shown', 'true');"
            )
            page = context.new_page()
            console_errors: list[str] = []
            failed_requests: list[str] = []
            guidance_responses: list[dict[str, Any]] = []
            page.on(
                "console",
                lambda message: console_errors.append(message.text)
                if message.type == "error"
                else None,
            )
            page.on("pageerror", lambda error: console_errors.append(str(error)))
            page.on(
                "requestfailed",
                lambda request: failed_requests.append(request.url),
            )
            page.on(
                "response",
                lambda response: guidance_responses.append(
                    {"url": response.url, "status": response.status}
                )
                if "/api/guidance/" in response.url
                else None,
            )
            response = page.goto(f"{PAGES_URL}/my-plan", wait_until="networkidle")
            page.wait_for_timeout(1000)
            close_brie = page.get_by_role("button", name="Close Counselor Brie")
            if close_brie.is_visible():
                close_brie.click()
            page.get_by_role("heading", name="My Plan", exact=True).wait_for(timeout=30000)
            page.get_by_role("heading", name="This Week", exact=True).wait_for(timeout=30000)
            require(
                checks,
                "authenticated_my_plan_ui",
                response is not None
                and response.status == 200
                and page.url.endswith("/my-plan")
                and bool(guidance_responses)
                and any(
                    "/api/guidance/plan" in item["url"] and item["status"] == 200
                    for item in guidance_responses
                )
                and all(item["status"] < 400 for item in guidance_responses),
                {
                    "document_status": response.status if response else None,
                    "guidance_responses": guidance_responses,
                },
            )
            require(
                checks,
                "browser_runtime_clean",
                not failed_requests and not console_errors,
                {"failed_requests": len(failed_requests), "console_errors": console_errors[:3]},
            )
            page.screenshot(path=str(screenshot), full_page=True)
            require(
                checks,
                "run_scoped_screenshot_created",
                screenshot.exists() and screenshot.stat().st_size > 0,
                {"path": str(screenshot), "bytes": screenshot.stat().st_size if screenshot.exists() else 0},
            )
            page.goto(f"{PAGES_URL}/briie", wait_until="networkidle")
            require(
                checks,
                "briie_route_quarantined",
                page.url.rstrip("/") == PAGES_URL,
                {"url": page.url},
            )
            browser.close()

    finally:
        cleanup_stage = "resolve_user_ids"
        try:
            qa_user_rows = query_staging_sql(
                "SELECT id FROM users "
                f"WHERE email IN ({sql_literal(student_email)}, {sql_literal(teacher_email)});"
            )
            qa_user_ids = [str(row["id"]) for row in qa_user_rows]
            qa_user_ids_sql = ", ".join(sql_literal(user_id) for user_id in qa_user_ids) or "''"
            student_pattern = sql_literal(f"%{student_email}%")
            teacher_pattern = sql_literal(f"%{teacher_email}%")
            cleanup_stage = "delete_run_owned_rows"
            run_staging_sql(
                "DELETE FROM rate_limits WHERE "
                f"(identifier={sql_literal(sentinel)} AND endpoint='qa-deployment-sentinel') OR "
                f"(identifier={sql_literal('qa:' + sentinel)} AND endpoint='register'); "
                "DELETE FROM notifications "
                f"WHERE metadata LIKE {student_pattern} OR metadata LIKE {teacher_pattern}; "
                "DELETE FROM guidance_session_answers "
                f"WHERE session_id IN (SELECT id FROM guidance_sessions WHERE user_id IN ({qa_user_ids_sql})); "
                "DELETE FROM revision_sessions "
                f"WHERE user_id IN ({qa_user_ids_sql}) OR topic_id={sql_literal(qa_topic_id)}; "
                "DELETE FROM users "
                f"WHERE email IN ({sql_literal(student_email)}, {sql_literal(teacher_email)}); "
                f"DELETE FROM topics WHERE id={sql_literal(qa_topic_id)};"
            )
            cleanup_stage = "verify_zero_residual"
            residual_rows = query_staging_sql(
                "SELECT 'users' AS scope, COUNT(*) AS count FROM users "
                f"WHERE email IN ({sql_literal(student_email)}, {sql_literal(teacher_email)}) "
                "UNION ALL SELECT 'user_goals', COUNT(*) FROM user_goals "
                f"WHERE user_id IN ({qa_user_ids_sql}) "
                "UNION ALL SELECT 'guidance_sessions', COUNT(*) FROM guidance_sessions "
                f"WHERE user_id IN ({qa_user_ids_sql}) "
                "UNION ALL SELECT 'counselor_conversations', COUNT(*) FROM counselor_conversations "
                f"WHERE user_id IN ({qa_user_ids_sql}) "
            ) + query_staging_sql(
                "SELECT 'revision_sessions' AS scope, COUNT(*) AS count FROM revision_sessions "
                f"WHERE user_id IN ({qa_user_ids_sql}) OR topic_id={sql_literal(qa_topic_id)} "
                "UNION ALL SELECT 'revision_lessons', COUNT(*) FROM revision_lessons "
                f"WHERE topic_id={sql_literal(qa_topic_id)} "
                "UNION ALL SELECT 'revision_ai_interactions', COUNT(*) FROM revision_ai_interactions "
                f"WHERE user_id IN ({qa_user_ids_sql}) "
                "UNION ALL SELECT 'question_attempts', COUNT(*) FROM question_attempts "
                f"WHERE user_id IN ({qa_user_ids_sql}) "
                "UNION ALL SELECT 'topics', COUNT(*) FROM topics "
                f"WHERE id={sql_literal(qa_topic_id)} "
                "UNION ALL SELECT 'notifications', COUNT(*) FROM notifications "
                f"WHERE metadata LIKE {student_pattern} OR metadata LIKE {teacher_pattern} "
                "UNION ALL SELECT 'rate_limits', COUNT(*) FROM rate_limits WHERE "
                f"(identifier={sql_literal(sentinel)} AND endpoint='qa-deployment-sentinel') OR "
                f"(identifier={sql_literal('qa:' + sentinel)} AND endpoint='register');"
            )
            residuals = {row["scope"]: row["count"] for row in residual_rows}
            checks.append(
                {
                    "name": "run_owned_cleanup_zero_residual",
                    "passed": len(residuals) == 11 and all(count == 0 for count in residuals.values()),
                    "detail": residuals,
                }
            )
        except Exception as error:
            checks.append(
                {
                    "name": "run_owned_cleanup_zero_residual",
                    "passed": False,
                    "detail": {"stage": cleanup_stage, "errorType": type(error).__name__},
                }
            )

    failed = [check["name"] for check in checks if not check["passed"]]
    print(json.dumps({
        "passed": len(checks) - len(failed),
        "failed": failed,
        "checks": checks,
        "screenshot": str(screenshot) if screenshot.exists() else None,
    }, indent=2))
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
