"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RELEASE = "wassce-remaining-null-topic-audit-2026-08-26";
const OUTPUT_DIR = path.resolve(
  __dirname,
  "../database/manifests/wassce-remaining-topic-remediation",
);
const EXCLUDED_SUBJECT_ID = "subj_wassce_elect_math";

const inclusive = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);
const ids = (prefix, values, width = 3) =>
  values.map((value) => `${prefix}${String(value).padStart(width, "0")}`);
const without = (values, excluded) =>
  values.filter((value) => !new Set(excluded).has(value));
const group = (
  topicId,
  evidence,
  questionIds,
  evidenceBasis = "reviewed-question-semantics-and-source-range",
) => ({
  topicId,
  evidenceBasis,
  evidence,
  questionIds,
});
const proposedGroup = (topicId, evidence, questionIds) =>
  group(
    topicId,
    evidence,
    questionIds,
    "official-curriculum-and-reviewed-question-semantics",
  );
const exception = (
  reasonCode,
  reason,
  evidence,
  questionIds,
  evidenceBasis = "reviewed-taxonomy-gap",
) => ({
  reasonCode,
  reason,
  evidenceBasis,
  evidence,
  questionIds,
});

const acc23 = (values) => ids("q_acc_2023_", values);
const acc24 = (values) => ids("q_acc_2024_", values);
const crs23 = (values) => ids("q_crs_2023_", values);
const crs24 = (values) => ids("q_crs_2024_", values);
const eco23 = (values) => ids("q_eco_2023_", values);
const eco24 = (values) => ids("q_eco_2024_", values);
const eng23 = (values) => ids("q_eng_2023_", values);
const eng24 = (values) => ids("q_eng_2024_", values);
const geo23 = (values) => ids("q_geo_2023_", values);
const geo24 = (values) => ids("q_geo_2024_", values);
const gov23 = (values) => ids("q_gov_2023_", values);
const gov24 = (values) => ids("q_gov_2024_", values);
const sci23 = (values) => ids("q_sci_2023_", values);
const sci24 = (values) => ids("q_sci_2024_", values);
const lit23 = (values) => ids("q_lit_2023_", values);
const lit24 = (values) => ids("q_lit_2024_", values);
const soc23 = (values) => ids("q_soc_2023_", values);
const soc24 = (values) => ids("q_soc_2024_", values);

const REPO_ONLY_EXCLUDED_IDS = [
  ...ids("q_wassce_bio_2023_", inclusive(11, 30), 2),
  ...ids("q_chem_elec_", inclusive(1, 5)),
  ...ids("q_chem_eq_", inclusive(2, 5)),
  "q_quadratic_005",
  ...ids("q_phy_kin_", inclusive(2, 5)),
  ...ids("q_wassce_phy_2023_", inclusive(1, 30), 2),
  ...ids("q_wassce_phy_2023_", inclusive(46, 50), 2),
].sort();
assert.equal(REPO_ONLY_EXCLUDED_IDS.length, 69);

const subjectDefinitions = [
  {
    subjectId: "subj_wassce_accounting",
    subjectName: "Financial Accounting",
    expectedNullTopicCount: 105,
    mappingGroups: [
      group(
        "topic_acc_intro",
        "Reviewed 2023/2024 concepts, accounting-equation and principle stems.",
        [...acc23(inclusive(1, 10)), ...acc24([1, 3, 4, 5, 8, 9])],
      ),
      group(
        "topic_acc_books",
        "Reviewed journal, day-book, cash-book and source-document stems plus the q_acc_jour source prefix.",
        [
          ...acc23([16, 17, 19, 20]),
          ...acc24([2, 6, 7, 11, 12, 16, 17, 18, 19]),
          ...ids("q_acc_jour_", inclusive(1, 5)),
        ],
      ),
      group(
        "topic_acc_ledger",
        "Reviewed debit/credit, account-balance, ledger and control-account stems.",
        [
          ...acc23([...inclusive(11, 15), 18, 30]),
          ...acc24([13, 14, 15, 20, 45, 46, 47, 48]),
        ],
      ),
      group(
        "topic_acc_trial",
        "Reviewed trial-balance purpose and balance stems.",
        [...acc23([21, 29]), ...acc24([10])],
      ),
      group(
        "topic_acc_errors",
        "Reviewed error-of-omission, principle, original-entry, transposition, compensating-error and suspense stems.",
        acc23(inclusive(22, 28)),
      ),
      group(
        "topic_acc_bank",
        "Reviewed bank-reconciliation, unpresented-cheque, deposit-in-transit, bank-charge and dishonoured-cheque stems.",
        acc24(inclusive(41, 44).concat([49, 50])),
      ),
      group(
        "topic_acc_depreciation",
        "Reviewed asset-depreciation, net-book-value, disposal and accumulated-depreciation stems.",
        acc24([31, 32, 33, 36, 39, 40]),
      ),
      group(
        "topic_acc_final",
        "Reviewed trading, final-account, adjustment, manufacturing-account and balance-sheet stems.",
        [
          ...acc23(inclusive(31, 44)),
          ...acc24([...inclusive(21, 30), 34, 35, 37, 38]),
        ],
      ),
      group(
        "topic_acc_partnership",
        "Reviewed partnership appropriation and current-account stems.",
        acc23(inclusive(45, 47)),
      ),
      group(
        "topic_acc_nonprofit",
        "Reviewed surplus, subscriptions and receipts-and-payments stems.",
        acc23(inclusive(48, 50)),
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_crs",
    subjectName: "Christian Religious Studies",
    expectedNullTopicCount: 105,
    mappingGroups: [
      group(
        "topic_crs_creation",
        "Reviewed Genesis creation, fall, Cain, Noah and Babel blocks.",
        [...crs23(inclusive(1, 10)), ...crs24(inclusive(1, 7))],
      ),
      group(
        "topic_crs_patriarchs",
        "Reviewed Abraham, Isaac, Jacob and Joseph blocks.",
        [...crs23(inclusive(11, 18)), ...crs24(inclusive(8, 11))],
      ),
      group(
        "topic_crs_moses",
        "Reviewed Moses, Exodus, wilderness and Law blocks.",
        [...crs23(inclusive(19, 26)), ...crs24(inclusive(12, 20))],
      ),
      group(
        "topic_crs_kings",
        "Reviewed Joshua, judges, monarchy, prophets and exile blocks.",
        [...crs23(inclusive(27, 40)), ...crs24(inclusive(21, 35))],
      ),
      group(
        "topic_crs_jesus",
        "Reviewed birth, ministry, discipleship, teaching and prayer stems.",
        [
          ...crs23([...inclusive(41, 44), 46]),
          ...crs24(inclusive(36, 40)),
          ...ids("q_crs_life_", [1, 3, 4, 5]),
        ],
      ),
      group(
        "topic_crs_parables",
        "Reviewed Good Samaritan, Beatitudes, Prodigal Son and Lazarus stems.",
        [...crs23([45]), ...crs24(inclusive(41, 43))],
      ),
      group(
        "topic_crs_passion",
        "Reviewed betrayal, crucifixion, denial and resurrection stems.",
        [...crs23([47, 48]), ...crs24([44, 45])],
      ),
      group(
        "topic_crs_church",
        "Reviewed Great Commission, early church, Pentecost, Paul and fruit-of-the-Spirit stems.",
        [
          ...crs23([49, 50]),
          ...crs24(inclusive(46, 50)),
          ...ids("q_crs_life_", [2]),
        ],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_economics",
    subjectName: "Economics",
    expectedNullTopicCount: 115,
    mappingGroups: [
      group(
        "topic_eco_intro",
        "Reviewed scarcity, choice, opportunity cost, factors of production and economic-system stems.",
        [
          ...eco23(inclusive(1, 10)),
          ...eco24(inclusive(1, 10)),
          ...ids("q_econ_basic_", inclusive(1, 5)),
        ],
      ),
      group(
        "topic_eco_demand",
        "Reviewed demand, supply, equilibrium, price-control, complements and substitutes stems.",
        [
          ...eco23([11, 12, 14, 15, 16, 18, 19]),
          ...eco24([11, 12, 13, 14, 18, 19, 20]),
          ...ids("q_econ_ds_", inclusive(1, 4)),
        ],
      ),
      group(
        "topic_eco_elasticity",
        "Reviewed demand/supply elasticity and responsiveness stems.",
        [
          ...eco23([13, 17, 20]),
          ...eco24([15, 16, 17]),
          ...ids("q_econ_ds_", [5]),
        ],
      ),
      group(
        "topic_eco_production",
        "Reviewed marginal returns, division of labour, short-run and economies-of-scale stems.",
        eco24([21, 25, 26, 28]),
      ),
      group(
        "topic_eco_costs",
        "Reviewed fixed, average and marginal cost stems.",
        eco24([22, 23, 24, 27]),
      ),
      group(
        "topic_eco_markets",
        "Reviewed perfect competition, monopoly, oligopoly, cartel and price-discrimination blocks.",
        [...eco23(inclusive(21, 28)), ...eco24(inclusive(29, 35))],
      ),
      group(
        "topic_eco_money",
        "Reviewed money, banking, inflation and monetary-policy stems.",
        [
          ...eco23(inclusive(29, 34)),
          ...eco24([...inclusive(36, 39), 42]),
          ...ids("q_econ_money_", inclusive(1, 5)),
        ],
      ),
      group(
        "topic_eco_national",
        "Reviewed GDP and multiplier stems that directly match national-income coverage.",
        [...eco23([42]), ...eco24([40, 41])],
      ),
      group(
        "topic_eco_trade",
        "Reviewed comparative advantage, tariffs, balance of trade, exchange rates, ECOWAS and FDI stems.",
        [
          ...eco23([35, ...inclusive(43, 50)]),
          ...eco24([...inclusive(43, 47), 50]),
        ],
      ),
      proposedGroup(
        "topic_eco_public_finance",
        "Official WAEC Economics topic 17 covers public finance; reviewed rows assess fiscal policy, taxation, public goods, budget deficits, externalities and privatization.",
        eco23(inclusive(36, 41)),
      ),
      proposedGroup(
        "topic_eco_development",
        "Official WAEC Economics topic 18 covers economic development and planning; reviewed rows assess development versus growth and the Human Development Index.",
        eco24([48, 49]),
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_english",
    subjectName: "English Language",
    expectedNullTopicCount: 100,
    mappingGroups: [
      group(
        "topic_wassce_english_grammar",
        "Reviewed concord, tense, voice, clauses, sentence types, pronouns, punctuation and parts-of-speech stems.",
        [
          ...eng23([1, 6, 8, 9, 11, 13, 15, 16, 19, 21, 23, 26, 27, 29, 33]),
          ...eng24([
            2, 7, 9, 11, 13, 14, 15, 17, 20, 22, 25, 26, 29, 31, 33, 35,
          ]),
        ],
      ),
      group(
        "topic_wassce_english_lexis",
        "Reviewed vocabulary, spelling, synonym, antonym, idiom and word-meaning stems.",
        [
          ...eng23(
            without(
              inclusive(1, 35),
              [
                1, 3, 6, 8, 9, 11, 13, 14, 15, 16, 19, 21, 23, 26, 27, 29, 30,
                33, 34,
              ],
            ),
          ),
          ...eng24(
            without(
              inclusive(1, 35),
              [
                2, 6, 7, 9, 11, 12, 13, 14, 15, 17, 20, 22, 23, 25, 26, 29, 31,
                33, 34, 35,
              ],
            ),
          ),
        ],
      ),
      group(
        "topic_wassce_english_oral",
        "Reviewed phoneme, syllable, rhyme, silent-letter and stress blocks.",
        [...eng23(inclusive(36, 50)), ...eng24(inclusive(36, 50))],
      ),
      proposedGroup(
        "topic_wassce_english_literary_devices",
        "Official NaCCA English content includes literary devices; reviewed rows assess metaphor, simile, pun, apostrophe, protagonist, personification, alliteration and paradox.",
        [...eng23([3, 14, 30, 34]), ...eng24([6, 12, 23, 34])],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_foods",
    subjectName: "Foods and Nutrition",
    expectedNullTopicCount: 20,
    mappingGroups: [
      group(
        "topic_fn_catering",
        "The q_food_cat source prefix and all reviewed stems are catering operations.",
        ids("q_food_cat_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
      group(
        "topic_fn_special_diets",
        "The q_food_diet source prefix and all reviewed stems are special-diet requirements.",
        ids("q_food_diet_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
      group(
        "topic_fn_food_prep",
        "The q_food_prep source prefix and reviewed cooking/storage stems match Food Preparation.",
        ids("q_food_prep_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
      group(
        "topic_fn_food_science",
        "The q_food_sci source prefix and reviewed protein, carbohydrate, oxidation, emulsification and gelatinization stems match Food Science.",
        ids("q_food_sci_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_geography",
    subjectName: "Geography",
    expectedNullTopicCount: 115,
    mappingGroups: [
      group(
        "topic_geo_physical",
        "Reviewed rocks, landforms, tectonics, rivers and earth-structure blocks.",
        [
          ...geo23(inclusive(1, 10)),
          ...geo24(inclusive(1, 10)),
          ...ids("q_geog_phys_", inclusive(1, 5)),
        ],
      ),
      group(
        "topic_geo_climate",
        "Reviewed weather instruments, winds, rainfall, atmosphere and climate stems.",
        [
          ...geo23([11, 13, 14, 16, 18]),
          ...geo24(inclusive(11, 20)),
          ...ids("q_geog_clim_", inclusive(1, 5)),
        ],
      ),
      group(
        "topic_geo_vegetation",
        "Reviewed savanna, mangrove, desert vegetation, deforestation and rainforest stems.",
        geo23([12, 15, 17, 19, 20]),
      ),
      group(
        "topic_geo_mapwork",
        "Reviewed scale, contour, bearing, grid, latitude and map-symbol blocks.",
        [
          ...geo23(inclusive(21, 30)),
          ...geo24(inclusive(21, 30)),
          ...ids("q_geog_map_", inclusive(1, 5)),
        ],
      ),
      group(
        "topic_geo_population",
        "Reviewed population growth, density, migration and population-pyramid stems.",
        [...geo23([31]), ...geo24([31, 32, 34, 35, 38])],
      ),
      group(
        "topic_geo_settlement",
        "Reviewed settlement pattern, CBD, urbanization, site and slum stems.",
        geo24([33, 36, 37, 39, 40]),
      ),
      group(
        "topic_geo_resources",
        "Reviewed agriculture, fishing, industry, resources, sustainability and tourism stems.",
        [...geo23(inclusive(32, 40)), ...geo24([...inclusive(41, 47), 49, 50])],
      ),
      group(
        "topic_geo_ghana",
        "Reviewed Volta, Ghanaian port and Akosombo stems.",
        geo23([45, 49, 50]),
      ),
      group(
        "topic_geo_africa",
        "Reviewed African deserts, lakes, rivers, rift valley, mountains, ECOWAS, mining and Sahel stems.",
        [...geo23([41, 42, 43, 44, 46, 47, 48]), ...geo24([48])],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_government",
    subjectName: "Government",
    expectedNullTopicCount: 110,
    mappingGroups: [
      group(
        "topic_gov_intro",
        "Reviewed power, legitimacy, authority, ideology, sovereignty, rule-of-law and public-opinion stems.",
        [...gov23(inclusive(1, 7)), ...gov24([1, 5, 10])],
      ),
      group(
        "topic_gov_constitution",
        "Reviewed constitution purpose, rigidity, sources and supremacy stems.",
        [...gov23(inclusive(8, 10)), ...gov24([15])],
      ),
      group(
        "topic_gov_organs",
        "Reviewed legislature, executive, judiciary, civil service, decentralization and checks-and-balances stems.",
        [
          ...gov23(inclusive(12, 15)),
          ...gov24([2, 3, 8, ...inclusive(16, 20)]),
          ...ids("q_gov_arms_", inclusive(1, 5)),
        ],
      ),
      group(
        "topic_gov_systems",
        "Reviewed federal, presidential, parliamentary, unitary and constitutional-monarchy stems.",
        gov24([6, 11, 12, 13, 14]),
      ),
      group(
        "topic_gov_parties",
        "Reviewed party systems, coalition and party-purpose stems.",
        [...gov23([21, 22, 23, 30]), ...gov24([4, 7, 9])],
      ),
      group(
        "topic_gov_elections",
        "Reviewed electoral commission, suffrage, ballot, voting systems, referendum and apathy stems.",
        [...gov23(inclusive(24, 29)), ...gov24(inclusive(21, 30))],
      ),
      group(
        "topic_gov_rights",
        "Reviewed citizenship, civil rights, Ombudsman and emergency-rights stems.",
        gov24(inclusive(31, 40)),
      ),
      group(
        "topic_gov_ghana",
        "Reviewed Ghanaian republic, party, constitution, independence, presidency, coup and local-government stems.",
        [
          ...gov23([31, 32, ...inclusive(35, 40)]),
          ...gov24([48, 49, 50]),
          ...ids("q_gov_local_", inclusive(1, 5)),
        ],
      ),
      proposedGroup(
        "topic_gov_public_admin",
        "Official WAEC Government topic 10 covers public and civil service administration; reviewed rows assess civil service, local government, public corporations, red tape and decentralization.",
        gov23([11, ...inclusive(16, 20)]),
      ),
      proposedGroup(
        "topic_gov_west_africa_development",
        "Official WASSCE Government materials assess West African political development; reviewed rows cover Nigerian independence, the Biafran War, colonialism, the Commonwealth and Pan-Africanism.",
        gov23([33, 34, 48, 49, 50]),
      ),
      proposedGroup(
        "topic_gov_international",
        "Official WAEC Government topics 17 and 18 cover foreign policy and international organizations; reviewed rows assess diplomacy, AU, ECOWAS, UN, WHO and non-alignment.",
        [...gov23(inclusive(41, 47)), ...gov24(inclusive(41, 47))],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_history",
    subjectName: "History",
    expectedNullTopicCount: 25,
    mappingGroups: [
      group(
        "topic_hist_au",
        "The q_his_au prefix and reviewed OAU/AU stems match exactly.",
        ids("q_his_au_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
      group(
        "topic_hist_world2",
        "The q_his_cw prefix and reviewed Cold War stems match exactly.",
        ids("q_his_cw_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
      group(
        "topic_hist_nigeria",
        "The q_his_nig prefix and reviewed Nigerian history stems match exactly.",
        ids("q_his_nig_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
      group(
        "topic_hist_postcolonial",
        "The q_his_post prefix and reviewed post-colonial Africa stems match exactly.",
        ids("q_his_post_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
      group(
        "topic_hist_world1",
        "The q_his_ww prefix and reviewed World War stems match exactly.",
        ids("q_his_ww_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_ict",
    subjectName: "Information & Comm. Technology",
    expectedNullTopicCount: 5,
    mappingGroups: [
      group(
        "topic_ict_wordproc",
        "The q_ict_wp prefix and all reviewed Microsoft Word stems match Word Processing.",
        ids("q_ict_wp_", inclusive(1, 5)),
        "id-prefix-and-reviewed-question-semantics",
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_int_science",
    subjectName: "Integrated Science",
    expectedNullTopicCount: 100,
    mappingGroups: [
      group(
        "topic_wassce_intsci_cells",
        "Reviewed cell structure, living characteristics, photosynthesis and plant-life stems.",
        [...sci23([1, 6, 10, 18]), ...sci24([1, 2, 4, 6, 18])],
      ),
      group(
        "topic_wassce_intsci_body",
        "Reviewed blood, skeleton, senses, digestion, nervous system, hormones and body-system stems.",
        [
          ...sci23([2, 4, 5, 7, 8, 11, 12, 13, 14, 15]),
          ...sci24([3, 7, 9, 10, 13, 15, 19, 20]),
        ],
      ),
      group(
        "topic_wassce_intsci_reproduction",
        "Reviewed heredity, DNA and reproduction stems.",
        [...sci23([9, 17]), ...sci24([8, 11])],
      ),
      group(
        "topic_wassce_intsci_matter",
        "Reviewed atoms, elements, compounds, states, metals, mixtures and physical/chemical change stems.",
        [
          ...sci23([21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35]),
          ...sci24([21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35]),
        ],
      ),
      group(
        "topic_wassce_intsci_acids",
        "Reviewed alkali, pH and acid-reaction stems.",
        [...sci23([22, 33]), ...sci24([23, 33])],
      ),
      group(
        "topic_wassce_intsci_energy",
        "Reviewed mechanics, energy, circuits, machines, work, force and electricity stems.",
        [
          ...sci23([3, 36, 38, 39, 40, 41, 42, 43, 44, 48, 49, 50]),
          ...sci24([17, 36, 37, 39, 40, 42, 44, 46, 47, 49]),
        ],
      ),
      group(
        "topic_wassce_intsci_waves",
        "Reviewed reflection, refraction, light, sound, frequency, mirrors, wavelength and rainbow stems.",
        [...sci23([37, 45, 46, 47]), ...sci24([38, 41, 43, 45, 48, 50])],
      ),
      group(
        "topic_wassce_intsci_agric",
        "Reviewed carbon-cycle/ecosystem and plant-transpiration stems.",
        [...sci23([16]), ...sci24([16])],
      ),
      group(
        "topic_wassce_intsci_health",
        "Reviewed vaccination, communicable disease, STI, malaria and greenhouse/pollution stems.",
        [...sci23([19, 20]), ...sci24([5, 12, 14])],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_literature",
    subjectName: "Literature in English",
    expectedNullTopicCount: 105,
    mappingGroups: [
      group(
        "topic_lit_intro",
        "Reviewed general literary-form, theme, setting and foreshadowing stems.",
        [...lit24([2, 3, 8, 10]), ...ids("q_lit_terms_", [5])],
      ),
      group(
        "topic_lit_devices",
        "Reviewed metaphor, irony, imagery, diction, symbolism and other device stems.",
        [
          ...lit23(inclusive(1, 15)),
          ...lit24([1, 5, 6, 7, 11, 13, 14, 15]),
          ...ids("q_lit_terms_", inclusive(1, 4)),
        ],
      ),
      group(
        "topic_lit_prose",
        "Reviewed character, conflict, narration, novel and prose-form stems.",
        [...lit23([...inclusive(16, 20), 29, 30]), ...lit24(inclusive(26, 35))],
      ),
      group(
        "topic_lit_drama",
        "Reviewed soliloquy, tragedy, play structure, Shakespeare and dramatic-device stems.",
        [
          ...lit23([...inclusive(21, 28), 46, 47]),
          ...lit24([12, ...inclusive(16, 25)]),
        ],
      ),
      group(
        "topic_lit_poetry",
        "Reviewed stanza, rhyme, meter, sonnet, lyric, ode and poetic-form stems.",
        [...lit23(inclusive(31, 40)), ...lit24([4, 9, ...inclusive(36, 45)])],
      ),
      group(
        "topic_lit_african",
        "Reviewed African writers, works, settings and Negritude stems.",
        [
          ...lit23([...inclusive(41, 45), 48, 49, 50]),
          ...lit24(inclusive(46, 50)),
        ],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_social",
    subjectName: "Social Studies",
    expectedNullTopicCount: 100,
    mappingGroups: [
      group(
        "topic_wassce_social_self",
        "Reviewed adolescence, substance abuse, peer pressure, self-esteem and personal social-problem stems.",
        [...soc23([13, 15, 16, 17]), ...soc24([16, 23, 24, 27])],
      ),
      group(
        "topic_wassce_social_culture",
        "Reviewed family, tolerance, stereotypes, nationalism, African identity, culture and national-unity stems.",
        [
          ...soc23([8, 12, 18, 19, 28, 29, 30, 31, 32, 33]),
          ...soc24([20, 21, 22, 25, 26, 28, 30, 33, 39, 40, 41, 48]),
        ],
      ),
      group(
        "topic_wassce_social_governance",
        "Reviewed arms of government, decentralization, elections, media, constitution and good-governance stems.",
        [
          ...soc23([21, 22, 23, 24, 25, 41, 42, 43, 44]),
          ...soc24([31, 32, 34, 35, 36, 38, 42, 43, 44, 45, 47, 49, 50]),
        ],
      ),
      group(
        "topic_wassce_social_citizenship",
        "Reviewed child rights, human rights, civic duties, voting and active-citizenship stems.",
        [...soc23([14, 26, 27, 36, 50]), ...soc24([17, 19, 29, 37, 46])],
      ),
      group(
        "topic_wassce_social_population",
        "Reviewed population growth, migration and family-planning stems.",
        [...soc23([2, 3, 11]), ...soc24([18])],
      ),
      group(
        "topic_wassce_social_environment",
        "Reviewed sanitation, pollution, conservation, climate, resources and sustainability stems.",
        [
          ...soc23([1, 4, 5, 6, 7, 10, 48]),
          ...soc24([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 15]),
        ],
      ),
      group(
        "topic_wassce_social_economy",
        "Reviewed tourism, globalization, taxation, unemployment, inflation, banking, community development, entrepreneurship and poverty stems.",
        [...soc23([9, 34, 35, 37, 38, 39, 40, 45, 46, 47]), ...soc24([10, 13])],
      ),
      group(
        "topic_wassce_social_peace",
        "Reviewed conflict resolution and national-security stems.",
        soc23([20, 49]),
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_biology",
    subjectName: "Biology",
    expectedNullTopicCount: 130,
    mappingGroups: [
      proposedGroup(
        "topic_wassce_biology_life_fundamental_unit",
        "Official NaCCA Biology strand 1 is Life in Fundamental Unit; reviewed rows assess cell structure, organization, transport, nutrition, respiration and genetics.",
        [
          ...ids("q_bio_2023_", inclusive(1, 10)),
          ...ids("q_bio_2024_", inclusive(1, 10)),
          ...ids("q_wassce_bio_2023_", inclusive(1, 10), 2),
        ],
      ),
      proposedGroup(
        "topic_wassce_biology_diversity_environment",
        "Official NaCCA Biology strand 2 is Diversity of Living Things and their Environment; reviewed rows assess classification, ecology, adaptation, evolution and environmental interactions.",
        [
          ...ids("q_bio_2023_", [...inclusive(11, 30), ...inclusive(46, 50)]),
          ...ids("q_bio_2024_", [...inclusive(11, 30), ...inclusive(41, 50)]),
          ...ids("q_wassce_bio_2023_", inclusive(41, 50), 2),
        ],
      ),
      proposedGroup(
        "topic_wassce_biology_systems_life",
        "Official NaCCA Biology strand 3 is Systems of Life; reviewed rows assess mammalian and plant transport, coordination, reproduction and homeostasis.",
        [
          ...ids("q_bio_2023_", inclusive(31, 45)),
          ...ids("q_bio_2024_", inclusive(31, 40)),
          ...ids("q_wassce_bio_2023_", inclusive(31, 40), 2),
        ],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_chemistry",
    subjectName: "Chemistry",
    expectedNullTopicCount: 150,
    mappingGroups: [
      proposedGroup(
        "topic_wassce_chem_physical",
        "Official NaCCA Chemistry strand 1 is Physical Chemistry; reviewed rows assess matter, atomic structure, bonding, stoichiometry, energetics, rates, equilibrium and electrochemistry.",
        [
          ...ids("q_chem_2023_", [...inclusive(21, 40), 46, 49]),
          ...ids("q_chem_2024_", inclusive(13, 35)),
          ...ids(
            "q_wassce_chem_2023_",
            [...inclusive(21, 30), ...inclusive(41, 50)],
            2,
          ),
        ],
      ),
      proposedGroup(
        "topic_wassce_chem_elements",
        "Official NaCCA Chemistry strand 2 is Systematic Chemistry of the Elements; reviewed rows assess periodicity, metals, non-metals, acids, bases, salts and qualitative analysis.",
        [
          ...ids("q_chem_2023_", inclusive(1, 20)),
          ...ids("q_chem_2024_", [...inclusive(1, 12), ...inclusive(46, 50)]),
          ...ids("q_wassce_chem_2023_", inclusive(1, 20), 2),
        ],
      ),
      proposedGroup(
        "topic_wassce_chem_carbon",
        "Official NaCCA Chemistry strand 3 is Chemistry of Carbon Compounds; reviewed rows assess hydrocarbons, functional groups, polymers, petroleum and organic reactions.",
        [
          ...ids("q_chem_2023_", [41, 42, 43, 44, 45, 47, 48, 50]),
          ...ids("q_chem_2024_", inclusive(36, 45)),
          ...ids("q_wassce_chem_2023_", inclusive(31, 40), 2),
        ],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_core_math",
    subjectName: "Core Mathematics",
    expectedNullTopicCount: 100,
    mappingGroups: [
      proposedGroup(
        "topic_wassce_core_math_numbers",
        "Official NaCCA Mathematics strand 1 is Numbers for Everyday Life; reviewed rows assess number systems, operations, percentages, rates, ratio and financial applications.",
        [
          ...ids("q_wm23_", inclusive(1, 10)),
          ...ids("q_wm24_", inclusive(1, 10)),
        ],
      ),
      proposedGroup(
        "topic_wassce_core_math_algebra",
        "Official NaCCA Mathematics strand 2 is Algebraic Reasoning; reviewed rows assess expressions, equations, inequalities, variation, functions and sequences.",
        [
          ...ids("q_wm23_", inclusive(11, 20)),
          ...ids("q_wm24_", inclusive(11, 20)),
        ],
      ),
      proposedGroup(
        "topic_wassce_core_math_geometry",
        "Official NaCCA Mathematics strand 3 is Geometry Around Us; reviewed rows assess mensuration, transformations, trigonometry, coordinate geometry and vectors.",
        [
          ...ids("q_wm23_", inclusive(21, 40)),
          ...ids("q_wm24_", inclusive(21, 40)),
        ],
      ),
      proposedGroup(
        "topic_wassce_core_math_data",
        "Official NaCCA Mathematics strand 4 is Making Sense of and Using Data; reviewed rows assess statistics, probability, charts and interpretation.",
        [
          ...ids("q_wm23_", inclusive(41, 50)),
          ...ids("q_wm24_", inclusive(41, 50)),
        ],
      ),
    ],
    exceptionGroups: [],
  },
  {
    subjectId: "subj_wassce_physics",
    subjectName: "Physics",
    expectedNullTopicCount: 115,
    mappingGroups: [
      proposedGroup(
        "topic_wassce_physics_mechanics_matter",
        "Official NaCCA Physics strand 1 is Mechanics and Matter; reviewed rows assess measurement, motion, forces, properties of matter, fluids and mechanics.",
        [
          ...ids("q_phy_2023_", inclusive(1, 15)),
          ...ids("q_phy_2024_", inclusive(1, 15)),
        ],
      ),
      proposedGroup(
        "topic_wassce_physics_energy",
        "Official NaCCA Physics strand 2 is Energy, including heat and waves; reviewed rows assess work, power, heat, optics, sound and wave phenomena.",
        [
          ...ids("q_phy_2023_", [...inclusive(16, 25), ...inclusive(41, 45)]),
          ...ids("q_phy_2024_", inclusive(16, 35)),
          ...ids("q_wassce_phy_2023_", inclusive(41, 45), 2),
        ],
      ),
      proposedGroup(
        "topic_wassce_physics_fields_electronics",
        "Official NaCCA Physics strand 3 covers electric field, magnetic field and electronics; reviewed rows assess electricity, magnetism, circuits and semiconductor electronics.",
        [
          ...ids("q_phy_2023_", inclusive(26, 40)),
          ...ids("q_phy_2024_", inclusive(36, 45)),
          ...ids("q_wassce_phy_2023_", inclusive(31, 40), 2),
        ],
      ),
      proposedGroup(
        "topic_wassce_physics_atomic_nuclear",
        "Official NaCCA Physics strand 4 is Atomic and Nuclear Physics; reviewed rows assess atomic structure, radioactivity, nuclear energy and modern physics.",
        [
          ...ids("q_phy_2023_", inclusive(46, 50)),
          ...ids("q_phy_2024_", inclusive(46, 50)),
        ],
      ),
    ],
    exceptionGroups: [],
  },
];

const SOURCE_NACCA_BIOLOGY = {
  authority: "National Council for Curriculum and Assessment (NaCCA), Ghana",
  title: "Biology Curriculum for Secondary Education (SHS 1-3), September 2023",
  url: "https://nacca.gov.gh/wp-content/uploads/2025/04/Biology-Curriculum.pdf",
};
const SOURCE_NACCA_CHEMISTRY = {
  authority: "National Council for Curriculum and Assessment (NaCCA), Ghana",
  title:
    "Chemistry Curriculum for Secondary Education (SHS 1-3), September 2023",
  url: "https://nacca.gov.gh/wp-content/uploads/2025/04/Chemistry-Curriculum.pdf",
};
const SOURCE_NACCA_MATHEMATICS = {
  authority: "National Council for Curriculum and Assessment (NaCCA), Ghana",
  title: "Mathematics Curriculum for Secondary Education",
  url: "https://nacca.gov.gh/wp-content/uploads/2025/04/Mathematics-Curriculum.pdf",
};
const SOURCE_NACCA_PHYSICS = {
  authority: "National Council for Curriculum and Assessment (NaCCA), Ghana",
  title: "Physics Curriculum for Secondary Education (SHS 1-3), September 2023",
  url: "https://nacca.gov.gh/wp-content/uploads/2025/04/Physics-Curriculum.pdf",
};
const SOURCE_WAEC_ECONOMICS = {
  authority: "West African Examinations Council, Ghana",
  title: "WAEC Ghana Economics Detailed Syllabus",
  url: "https://waecgh.org/wp-content/uploads/2024/07/ECONOMICS.pdf",
};
const SOURCE_NACCA_ENGLISH = {
  authority: "National Council for Curriculum and Assessment (NaCCA), Ghana",
  title: "English Language Curriculum",
  url: "https://www.nacca.gov.gh/wp-content/uploads/2023/06/ENGLISH-LANGUAGE.pdf",
};
const SOURCE_WAEC_GOVERNMENT = {
  authority: "West African Examinations Council, Ghana",
  title: "WAEC Ghana Government Syllabus",
  url: "https://waecgh.org/wp-content/uploads/2024/07/GOVERNMENT.pdf",
};
const SOURCE_WAEC_WEST_AFRICA = {
  authority: "West African Examinations Council",
  title: "WASSCE Government e-learning: political developments in West Africa",
  url: "https://www.waeconline.org.ng/e-learning/Government/Govt240mq9.html",
};

const proposal = (subjectId, name, slug, description, ...officialSources) => ({
  subjectId,
  name,
  slug,
  description,
  officialSources,
});

const TOPIC_PROPOSALS = {
  topic_wassce_biology_life_fundamental_unit: proposal(
    "subj_wassce_biology",
    "Life in Fundamental Unit",
    "life-fundamental-unit",
    "Cellular organization and the fundamental processes that sustain life.",
    SOURCE_NACCA_BIOLOGY,
  ),
  topic_wassce_biology_diversity_environment: proposal(
    "subj_wassce_biology",
    "Diversity of Living Things and their Environment",
    "diversity-living-things-environment",
    "Classification, ecology, adaptation, evolution and organism-environment relationships.",
    SOURCE_NACCA_BIOLOGY,
  ),
  topic_wassce_biology_systems_life: proposal(
    "subj_wassce_biology",
    "Systems of Life",
    "systems-of-life",
    "Mammalian and plant transport, coordination, reproduction and homeostasis.",
    SOURCE_NACCA_BIOLOGY,
  ),
  topic_wassce_chem_physical: proposal(
    "subj_wassce_chemistry",
    "Physical Chemistry",
    "physical-chemistry",
    "Matter, atomic structure, bonding, quantitative chemistry, energetics, kinetics and equilibrium.",
    SOURCE_NACCA_CHEMISTRY,
  ),
  topic_wassce_chem_elements: proposal(
    "subj_wassce_chemistry",
    "Systematic Chemistry of the Elements",
    "systematic-chemistry-elements",
    "Periodic trends and the properties and reactions of metals and non-metals.",
    SOURCE_NACCA_CHEMISTRY,
  ),
  topic_wassce_chem_carbon: proposal(
    "subj_wassce_chemistry",
    "Chemistry of Carbon Compounds",
    "chemistry-carbon-compounds",
    "Hydrocarbons, functional groups, polymers and organic chemical reactions.",
    SOURCE_NACCA_CHEMISTRY,
  ),
  topic_wassce_core_math_numbers: proposal(
    "subj_wassce_core_math",
    "Numbers for Everyday Life",
    "numbers-everyday-life",
    "Number concepts, operations, ratio, rates, percentages and financial applications.",
    SOURCE_NACCA_MATHEMATICS,
  ),
  topic_wassce_core_math_algebra: proposal(
    "subj_wassce_core_math",
    "Algebraic Reasoning",
    "algebraic-reasoning",
    "Expressions, equations, inequalities, variation, functions and sequences.",
    SOURCE_NACCA_MATHEMATICS,
  ),
  topic_wassce_core_math_geometry: proposal(
    "subj_wassce_core_math",
    "Geometry Around Us",
    "geometry-around-us",
    "Mensuration, transformations, trigonometry, coordinate geometry and vectors.",
    SOURCE_NACCA_MATHEMATICS,
  ),
  topic_wassce_core_math_data: proposal(
    "subj_wassce_core_math",
    "Making Sense of and Using Data",
    "making-sense-using-data",
    "Statistics, probability, graphical representation and interpretation of data.",
    SOURCE_NACCA_MATHEMATICS,
  ),
  topic_wassce_physics_mechanics_matter: proposal(
    "subj_wassce_physics",
    "Mechanics and Matter",
    "mechanics-and-matter",
    "Measurement, motion, forces and the mechanical properties of matter.",
    SOURCE_NACCA_PHYSICS,
  ),
  topic_wassce_physics_energy: proposal(
    "subj_wassce_physics",
    "Energy",
    "energy",
    "Work, power, heat, optics, sound and wave phenomena.",
    SOURCE_NACCA_PHYSICS,
  ),
  topic_wassce_physics_fields_electronics: proposal(
    "subj_wassce_physics",
    "Electric Field, Magnetic Field and Electronics",
    "electric-magnetic-fields-electronics",
    "Electricity, magnetism, circuits and semiconductor electronics.",
    SOURCE_NACCA_PHYSICS,
  ),
  topic_wassce_physics_atomic_nuclear: proposal(
    "subj_wassce_physics",
    "Atomic and Nuclear Physics",
    "atomic-nuclear-physics",
    "Atomic structure, radioactivity, nuclear energy and modern physics.",
    SOURCE_NACCA_PHYSICS,
  ),
  topic_eco_public_finance: proposal(
    "subj_wassce_economics",
    "Public Finance",
    "public-finance",
    "Government revenue, expenditure, taxation, budgets, public goods and fiscal policy.",
    SOURCE_WAEC_ECONOMICS,
  ),
  topic_eco_development: proposal(
    "subj_wassce_economics",
    "Economic Development and Planning",
    "economic-development-planning",
    "Economic growth, development indicators, planning and development policy.",
    SOURCE_WAEC_ECONOMICS,
  ),
  topic_wassce_english_literary_devices: proposal(
    "subj_wassce_english",
    "Literary Devices",
    "literary-devices",
    "Figures of speech and other literary terms used in English-language interpretation.",
    SOURCE_NACCA_ENGLISH,
  ),
  topic_gov_public_admin: proposal(
    "subj_wassce_government",
    "Public Administration",
    "public-administration",
    "Civil service, public corporations, local government and administrative practice.",
    SOURCE_WAEC_GOVERNMENT,
  ),
  topic_gov_west_africa_development: proposal(
    "subj_wassce_government",
    "Political Developments in West Africa",
    "political-developments-west-africa",
    "Colonial and post-colonial political developments across West African states.",
    SOURCE_WAEC_WEST_AFRICA,
  ),
  topic_gov_international: proposal(
    "subj_wassce_government",
    "Foreign Policy and International Organizations",
    "foreign-policy-international-organizations",
    "Foreign policy, diplomacy, regional bodies and international organizations.",
    SOURCE_WAEC_GOVERNMENT,
  ),
};
assert.equal(Object.keys(TOPIC_PROPOSALS).length, 20);

function buildSubjectManifest(definition) {
  const mappingGroups = definition.mappingGroups.map((item) => ({
    ...item,
    questionIds: [...item.questionIds].sort(),
  }));
  const reviewedExceptions = definition.exceptionGroups.map((item) => ({
    ...item,
    questionIds: [...item.questionIds].sort(),
  }));
  const mappedQuestionCount = mappingGroups.reduce(
    (total, item) => total + item.questionIds.length,
    0,
  );
  const exceptionCount = reviewedExceptions.reduce(
    (total, item) => total + item.questionIds.length,
    0,
  );
  assert.equal(
    mappedQuestionCount + exceptionCount,
    definition.expectedNullTopicCount,
    `${definition.subjectId}: configured total mismatch`,
  );
  const allIds = [...mappingGroups, ...reviewedExceptions].flatMap(
    (item) => item.questionIds,
  );
  assert.equal(
    new Set(allIds).size,
    allIds.length,
    `${definition.subjectId}: duplicate configured question ID`,
  );
  return {
    release: RELEASE,
    subjectId: definition.subjectId,
    subjectName: definition.subjectName,
    expectedNullTopicCount: definition.expectedNullTopicCount,
    mappedQuestionCount,
    exceptionCount,
    mappingGroups,
    reviewedExceptions,
  };
}

function buildSubjectManifests() {
  const manifests = subjectDefinitions
    .map(buildSubjectManifest)
    .sort((left, right) => left.subjectId.localeCompare(right.subjectId));
  assert.equal(
    new Set(manifests.map((item) => item.subjectId)).size,
    manifests.length,
    "duplicate subject definition",
  );
  assert.ok(
    manifests.every((item) => item.subjectId !== EXCLUDED_SUBJECT_ID),
    "Elective Mathematics must remain excluded",
  );
  return manifests;
}

function buildExceptionLedger(manifests = buildSubjectManifests()) {
  const subjects = manifests
    .filter((manifest) => manifest.exceptionCount > 0)
    .map((manifest) => ({
      subjectId: manifest.subjectId,
      subjectName: manifest.subjectName,
      exceptionCount: manifest.exceptionCount,
      reviewedExceptions: manifest.reviewedExceptions,
    }));
  return {
    release: RELEASE,
    scope:
      "Active WASSCE null-topic questions excluding subj_wassce_elect_math",
    totalExpectedNullTopicCount: manifests.reduce(
      (total, item) => total + item.expectedNullTopicCount,
      0,
    ),
    totalMappedQuestionCount: manifests.reduce(
      (total, item) => total + item.mappedQuestionCount,
      0,
    ),
    totalExceptionCount: manifests.reduce(
      (total, item) => total + item.exceptionCount,
      0,
    ),
    subjects,
  };
}

function buildTaxonomyProposal(manifests = buildSubjectManifests()) {
  const proposedGroups = manifests.flatMap((manifest) =>
    manifest.mappingGroups
      .filter(
        (item) =>
          item.evidenceBasis ===
          "official-curriculum-and-reviewed-question-semantics",
      )
      .map((item) => ({ manifest, item })),
  );
  const proposedTopicIds = proposedGroups
    .map(({ item }) => item.topicId)
    .sort();
  assert.deepEqual(
    proposedTopicIds,
    Object.keys(TOPIC_PROPOSALS).sort(),
    "taxonomy proposal metadata/mapping coverage mismatch",
  );
  const topics = proposedGroups
    .map(({ manifest, item }) => {
      const metadata = TOPIC_PROPOSALS[item.topicId];
      assert.equal(
        metadata.subjectId,
        manifest.subjectId,
        item.topicId + ": proposal subject mismatch",
      );
      return {
        topicId: item.topicId,
        subjectId: metadata.subjectId,
        name: metadata.name,
        slug: metadata.slug,
        description: metadata.description,
        evidenceBasis: item.evidenceBasis,
        sourceEvidence: item.evidence,
        officialSources: metadata.officialSources,
        questionIds: [...item.questionIds].sort(),
      };
    })
    .sort((left, right) => left.topicId.localeCompare(right.topicId));
  const proposedQuestionCount = topics.reduce(
    (total, item) => total + item.questionIds.length,
    0,
  );
  const residualExceptionCount = manifests.reduce(
    (total, item) => total + item.exceptionCount,
    0,
  );
  assert.equal(topics.length, 20);
  assert.equal(proposedQuestionCount, 536);
  assert.equal(residualExceptionCount, 0);
  return {
    release: RELEASE,
    scope:
      "Proposal-only same-subject taxonomy additions for authoritative production WASSCE null-topic inventory excluding Elective Mathematics",
    status: "proposal-only-no-numbered-migration",
    sourcePolicy:
      "Official WAEC or Ghana NaCCA curriculum evidence plus manual question-semantics review; text similarity alone is not accepted.",
    liveInventoryOverlay: {
      repositoryFixtureNullTopicCount: 1569,
      authoritativeProductionNullTopicCount: 1500,
      excludedRepoOnlyCount: REPO_ONLY_EXCLUDED_IDS.length,
      excludedRepoOnlyQuestionIds: [...REPO_ONLY_EXCLUDED_IDS],
    },
    proposedTopicCount: topics.length,
    proposedQuestionCount,
    residualExceptionCount,
    topics,
  };
}

function writeManifests(outputDir = OUTPUT_DIR) {
  const manifests = buildSubjectManifests();
  fs.mkdirSync(outputDir, { recursive: true });
  for (const manifest of manifests) {
    const filename = `${manifest.subjectId.replace(/^subj_wassce_/, "")}.json`;
    fs.writeFileSync(
      path.join(outputDir, filename),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
  const ledger = buildExceptionLedger(manifests);
  fs.writeFileSync(
    path.join(outputDir, "reviewed-exceptions.json"),
    `${JSON.stringify(ledger, null, 2)}\n`,
  );
  const taxonomyProposal = buildTaxonomyProposal(manifests);
  fs.writeFileSync(
    path.join(outputDir, "taxonomy-proposals.json"),
    `${JSON.stringify(taxonomyProposal, null, 2)}\n`,
  );
  return { manifests, ledger, taxonomyProposal };
}

if (require.main === module) {
  if (process.argv.includes("--write")) {
    const { manifests, ledger, taxonomyProposal } = writeManifests();
    process.stdout.write(
      `${JSON.stringify({ outputDir: OUTPUT_DIR, subjects: manifests.length, mapped: ledger.totalMappedQuestionCount, exceptions: ledger.totalExceptionCount, proposedTopics: taxonomyProposal.proposedTopicCount }, null, 2)}\n`,
    );
  } else {
    process.stdout.write(
      `${JSON.stringify({ manifests: buildSubjectManifests(), exceptionLedger: buildExceptionLedger(), taxonomyProposal: buildTaxonomyProposal() }, null, 2)}\n`,
    );
  }
}

module.exports = {
  EXCLUDED_SUBJECT_ID,
  OUTPUT_DIR,
  RELEASE,
  REPO_ONLY_EXCLUDED_IDS,
  buildExceptionLedger,
  buildSubjectManifests,
  buildTaxonomyProposal,
  writeManifests,
};
