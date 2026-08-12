-- Migration: Add 5 questions to each of the 84 topics with 0-1 questions
-- Part 1: Business Management, Cost Accounting, Technical Drawing

-- =============================================
-- BUSINESS MANAGEMENT - Additional Questions (8 topics × 5 = 40 questions)
-- =============================================

-- Introduction to Business (4 more needed - has 1)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bm_intro_002', 'subj_wassce_business_mgt', 'topic_bm_intro', 'Which type of business organization has unlimited liability?', '["Public limited company","Private limited company","Sole proprietorship","Corporation"]', 2, 'Sole proprietors have unlimited liability, meaning personal assets can be used to pay business debts.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_intro_003', 'subj_wassce_business_mgt', 'topic_bm_intro', 'A franchise is best described as:', '["A government-owned business","A license to operate under an established brand","A type of partnership","A non-profit organization"]', 1, 'A franchise is a license granted by a company to an individual to operate a business using the company''s brand and systems.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_intro_004', 'subj_wassce_business_mgt', 'topic_bm_intro', 'The main objective of a business is to:', '["Employ many workers","Maximize profit","Pay taxes","Produce goods only"]', 1, 'The primary objective of most businesses is to maximize profit while providing goods or services.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_intro_005', 'subj_wassce_business_mgt', 'topic_bm_intro', 'A cooperative society is owned by:', '["The government","Individual entrepreneurs","Members who share profits","Foreign investors"]', 2, 'Cooperatives are owned and controlled by their members who share in the profits and benefits.', 'easy', 'multiple_choice', datetime('now'));

-- Management Principles (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bm_mgt_002', 'subj_wassce_business_mgt', 'topic_bm_management', 'Henri Fayol is known as the father of:', '["Scientific management","Administrative management","Human relations","Operations management"]', 1, 'Henri Fayol developed the 14 principles of management and is considered the father of administrative/modern management.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_mgt_003', 'subj_wassce_business_mgt', 'topic_bm_management', 'Span of control refers to:', '["The number of subordinates a manager supervises","The physical area of a business","The budget of a department","The time taken to complete tasks"]', 0, 'Span of control is the number of subordinates that report directly to a manager.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_mgt_004', 'subj_wassce_business_mgt', 'topic_bm_management', 'Delegation involves:', '["Keeping all authority","Transferring authority to subordinates","Firing employees","Reducing salaries"]', 1, 'Delegation is the process of assigning authority and responsibility to subordinates to complete tasks.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_mgt_005', 'subj_wassce_business_mgt', 'topic_bm_management', 'SWOT analysis examines:', '["Sales, Wages, Output, Tax","Strengths, Weaknesses, Opportunities, Threats","Supply, Wholesale, Operations, Trade","Staff, Work, Organization, Training"]', 1, 'SWOT analysis is a strategic planning tool examining internal Strengths and Weaknesses, and external Opportunities and Threats.', 'easy', 'multiple_choice', datetime('now'));

-- Marketing (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bm_mkt_002', 'subj_wassce_business_mgt', 'topic_bm_marketing', 'Market segmentation involves:', '["Selling to everyone equally","Dividing market into distinct groups","Reducing prices","Increasing production"]', 1, 'Market segmentation divides a market into distinct groups of buyers with different needs or characteristics.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_mkt_003', 'subj_wassce_business_mgt', 'topic_bm_marketing', 'A unique selling proposition (USP) is:', '["The lowest price","What makes a product different from competitors","The production cost","The distribution channel"]', 1, 'A USP is a factor that differentiates a product from its competitors, giving customers a reason to buy.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_mkt_004', 'subj_wassce_business_mgt', 'topic_bm_marketing', 'Which is NOT a type of advertising media?', '["Television","Radio","Inventory","Newspapers"]', 2, 'Inventory refers to stock/goods, not an advertising medium. TV, radio, and newspapers are advertising media.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_mkt_005', 'subj_wassce_business_mgt', 'topic_bm_marketing', 'The product life cycle includes:', '["Introduction, Growth, Maturity, Decline","Planning, Production, Sales, Profit","Design, Make, Sell, Close","Research, Development, Launch, End"]', 0, 'The product life cycle stages are Introduction, Growth, Maturity, and Decline.', 'medium', 'multiple_choice', datetime('now'));

-- Human Resource Management (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bm_hr_002', 'subj_wassce_business_mgt', 'topic_bm_hr', 'On-the-job training occurs:', '["Before employment","At the workplace during work","At external institutions only","After retirement"]', 1, 'On-the-job training takes place at the workplace while the employee performs their duties.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_hr_003', 'subj_wassce_business_mgt', 'topic_bm_hr', 'Job analysis determines:', '["Employee salaries only","Duties, responsibilities, and qualifications for a job","Company profits","Market share"]', 1, 'Job analysis identifies the duties, responsibilities, skills, and qualifications required for a specific job.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_hr_004', 'subj_wassce_business_mgt', 'topic_bm_hr', 'Staff turnover refers to:', '["Profit from staff activities","Rate at which employees leave and are replaced","Number of staff meetings","Staff productivity levels"]', 1, 'Staff turnover is the rate at which employees leave an organization and are replaced by new hires.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_hr_005', 'subj_wassce_business_mgt', 'topic_bm_hr', 'Maslow''s hierarchy of needs starts with:', '["Self-actualization","Social needs","Physiological needs","Esteem needs"]', 2, 'Maslow''s hierarchy begins with physiological needs (food, water, shelter) as the most basic level.', 'medium', 'multiple_choice', datetime('now'));

-- Business Finance (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bm_fin_002', 'subj_wassce_business_mgt', 'topic_bm_finance', 'Working capital is:', '["Fixed assets minus liabilities","Current assets minus current liabilities","Total revenue","Long-term investments"]', 1, 'Working capital = Current Assets - Current Liabilities. It measures short-term financial health.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_fin_003', 'subj_wassce_business_mgt', 'topic_bm_finance', 'A debenture is:', '["A type of share","A loan certificate issued by a company","A bank account","A type of insurance"]', 1, 'A debenture is a long-term loan instrument/certificate issued by a company acknowledging a debt.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_fin_004', 'subj_wassce_business_mgt', 'topic_bm_finance', 'Venture capital is typically provided to:', '["Large established companies","Start-ups and high-risk businesses","Government agencies","Non-profit organizations"]', 1, 'Venture capital is financing provided to start-ups and small businesses with high growth potential but high risk.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_fin_005', 'subj_wassce_business_mgt', 'topic_bm_finance', 'Trade credit allows a business to:', '["Get free goods","Pay suppliers later","Avoid taxes","Increase share capital"]', 1, 'Trade credit allows a business to buy goods now and pay the supplier at a later date.', 'easy', 'multiple_choice', datetime('now'));

-- Production Management (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bm_prod_001', 'subj_wassce_business_mgt', 'topic_bm_production', 'Mass production is characterized by:', '["Custom-made products","Large-scale production of standardized goods","Small batch production","One-off production"]', 1, 'Mass production involves manufacturing large quantities of standardized products using assembly lines.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_prod_002', 'subj_wassce_business_mgt', 'topic_bm_production', 'Just-in-time (JIT) production aims to:', '["Store large inventories","Reduce inventory by producing as needed","Increase warehouse space","Slow down production"]', 1, 'JIT minimizes inventory by producing goods only when needed, reducing storage costs and waste.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_prod_003', 'subj_wassce_business_mgt', 'topic_bm_production', 'Quality control involves:', '["Selling defective products","Inspecting products to meet standards","Reducing production","Ignoring customer complaints"]', 1, 'Quality control is the process of inspecting products to ensure they meet specified standards.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_prod_004', 'subj_wassce_business_mgt', 'topic_bm_production', 'Batch production is suitable for:', '["Unique custom orders","Medium quantities of similar products","Continuous mass production","Single unit production"]', 1, 'Batch production is used when similar products are made in groups or batches.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_prod_005', 'subj_wassce_business_mgt', 'topic_bm_production', 'Total Quality Management (TQM) focuses on:', '["Short-term profits only","Continuous improvement in all processes","Reducing employee numbers","Limiting customer feedback"]', 1, 'TQM is a management approach focused on continuous improvement in all organizational processes.', 'medium', 'multiple_choice', datetime('now'));

-- Office Practice (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bm_off_001', 'subj_wassce_business_mgt', 'topic_bm_office', 'A memorandum is used for:', '["External communication only","Internal communication within an organization","Legal contracts","Public announcements"]', 1, 'A memorandum (memo) is used for internal communication between staff within an organization.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_off_002', 'subj_wassce_business_mgt', 'topic_bm_office', 'Vertical filing arranges documents:', '["Flat in drawers","Upright in folders","In circular containers","On open shelves only"]', 1, 'Vertical filing stores documents upright in folders within filing cabinet drawers.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_off_003', 'subj_wassce_business_mgt', 'topic_bm_office', 'An agenda is:', '["Minutes of a meeting","A list of items to be discussed at a meeting","A financial report","An employee evaluation"]', 1, 'An agenda lists the items or topics to be discussed at a meeting.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_off_004', 'subj_wassce_business_mgt', 'topic_bm_office', 'Which is an input device in office automation?', '["Printer","Scanner","Monitor","Speaker"]', 1, 'A scanner is an input device that converts physical documents into digital format.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_off_005', 'subj_wassce_business_mgt', 'topic_bm_office', 'Alphabetical filing arranges files by:', '["Date","Name in A-Z order","Size","Subject matter"]', 1, 'Alphabetical filing organizes documents by name in A to Z order.', 'easy', 'multiple_choice', datetime('now'));

-- Business Ethics (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bm_eth_001', 'subj_wassce_business_mgt', 'topic_bm_ethics', 'Corporate Social Responsibility (CSR) refers to:', '["Maximizing profits at all costs","Business obligations to society and environment","Avoiding all taxes","Reducing employee wages"]', 1, 'CSR is a business model where companies integrate social and environmental concerns into their operations.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_eth_002', 'subj_wassce_business_mgt', 'topic_bm_ethics', 'Business ethics involves:', '["Breaking laws for profit","Moral principles guiding business conduct","Ignoring stakeholders","Avoiding regulations"]', 1, 'Business ethics are moral principles and standards that guide behavior in the business world.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_eth_003', 'subj_wassce_business_mgt', 'topic_bm_ethics', 'A whistleblower is someone who:', '["Promotes company products","Reports wrongdoing within an organization","Manages finances","Hires employees"]', 1, 'A whistleblower exposes information about illegal or unethical practices within an organization.', 'medium', 'multiple_choice', datetime('now')),
('q_bm_eth_004', 'subj_wassce_business_mgt', 'topic_bm_ethics', 'Stakeholders in a business include:', '["Only shareholders","All parties affected by business decisions","Only employees","Only customers"]', 1, 'Stakeholders include anyone affected by a business: shareholders, employees, customers, suppliers, community.', 'easy', 'multiple_choice', datetime('now')),
('q_bm_eth_005', 'subj_wassce_business_mgt', 'topic_bm_ethics', 'Sustainable business practices aim to:', '["Deplete resources quickly","Meet present needs without compromising future generations","Maximize short-term profits only","Ignore environmental impact"]', 1, 'Sustainable practices balance economic, social, and environmental considerations for long-term viability.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- COST ACCOUNTING - Additional Questions (7 topics)
-- =============================================

-- Introduction to Cost Accounting (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_intro_002', 'subj_wassce_cost_accounting', 'topic_ca_intro', 'Cost accounting differs from financial accounting in that it:', '["Focuses on external reporting","Focuses on internal decision-making","Is required by law","Uses only historical data"]', 1, 'Cost accounting focuses on internal management decisions, while financial accounting is for external stakeholders.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_intro_003', 'subj_wassce_cost_accounting', 'topic_ca_intro', 'A cost center is:', '["A profit-making unit","A unit where costs are collected but revenue is not measured","A type of expense","A bank account"]', 1, 'A cost center is a department or unit where costs are accumulated but no direct revenue is generated.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_intro_004', 'subj_wassce_cost_accounting', 'topic_ca_intro', 'Direct costs can be:', '["Easily traced to a cost object","Not traced to products","Always fixed","Never variable"]', 0, 'Direct costs can be easily and accurately traced to a specific cost object like a product.', 'easy', 'multiple_choice', datetime('now')),
('q_ca_intro_005', 'subj_wassce_cost_accounting', 'topic_ca_intro', 'Indirect costs are also known as:', '["Prime costs","Overhead costs","Direct materials","Direct labor"]', 1, 'Indirect costs (overheads) cannot be directly traced to a specific product or service.', 'easy', 'multiple_choice', datetime('now'));

-- Elements of Cost (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_elem_002', 'subj_wassce_cost_accounting', 'topic_ca_elements', 'Prime cost equals:', '["Direct materials + Direct labor","Total overheads","Fixed costs only","Selling expenses"]', 0, 'Prime cost = Direct Materials + Direct Labor. It excludes all overheads.', 'easy', 'multiple_choice', datetime('now')),
('q_ca_elem_003', 'subj_wassce_cost_accounting', 'topic_ca_elements', 'Factory cost equals:', '["Prime cost + Factory overhead","Prime cost only","Selling price","Administration cost"]', 0, 'Factory cost (works cost) = Prime Cost + Factory Overhead.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_elem_004', 'subj_wassce_cost_accounting', 'topic_ca_elements', 'Which is a direct expense?', '["Factory rent","Electricity for the whole factory","Royalty paid per unit produced","Manager''s salary"]', 2, 'Royalties paid per unit are direct expenses as they can be traced directly to products.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_elem_005', 'subj_wassce_cost_accounting', 'topic_ca_elements', 'Conversion cost includes:', '["Direct materials only","Direct labor + Factory overhead","Selling expenses","Direct materials + Direct labor"]', 1, 'Conversion cost = Direct Labor + Factory Overhead. It''s the cost to convert raw materials into finished goods.', 'medium', 'multiple_choice', datetime('now'));

-- Material Costing (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_mat_002', 'subj_wassce_cost_accounting', 'topic_ca_materials', 'LIFO stands for:', '["Last In, First Out","Lowest In, First Out","Last Input, Final Output","Limited Inventory Flow Order"]', 0, 'LIFO (Last In, First Out) assumes the most recently purchased items are sold first.', 'easy', 'multiple_choice', datetime('now')),
('q_ca_mat_003', 'subj_wassce_cost_accounting', 'topic_ca_materials', 'Economic Order Quantity (EOQ) minimizes:', '["Sales revenue","Total inventory costs","Production time","Labor costs"]', 1, 'EOQ is the order quantity that minimizes total inventory costs (ordering + holding costs).', 'medium', 'multiple_choice', datetime('now')),
('q_ca_mat_004', 'subj_wassce_cost_accounting', 'topic_ca_materials', 'Reorder level is calculated as:', '["Maximum consumption × Maximum lead time","Average consumption × Average lead time","Minimum stock only","EOQ × 2"]', 0, 'Reorder level = Maximum Usage × Maximum Lead Time, ensuring stock doesn''t run out.', 'hard', 'multiple_choice', datetime('now')),
('q_ca_mat_005', 'subj_wassce_cost_accounting', 'topic_ca_materials', 'Weighted average cost method:', '["Uses the oldest costs first","Calculates average cost of all units available","Uses the newest costs first","Ignores inventory values"]', 1, 'Weighted average calculates the average cost of all units available for sale during the period.', 'medium', 'multiple_choice', datetime('now'));

-- Labor Costing (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_lab_002', 'subj_wassce_cost_accounting', 'topic_ca_labor', 'Piece rate wages are based on:', '["Hours worked","Number of units produced","Monthly salary","Seniority"]', 1, 'Piece rate pays workers based on the number of units or pieces they produce.', 'easy', 'multiple_choice', datetime('now')),
('q_ca_lab_003', 'subj_wassce_cost_accounting', 'topic_ca_labor', 'Overtime premium is:', '["Regular pay for extra hours","Extra pay above normal rate for overtime","A bonus for attendance","A pension contribution"]', 1, 'Overtime premium is the additional amount paid above the normal hourly rate for overtime hours.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_lab_004', 'subj_wassce_cost_accounting', 'topic_ca_labor', 'Labor turnover is calculated as:', '["Number of leavers ÷ Average employees × 100","Total wages ÷ Hours worked","Output ÷ Input","Profit ÷ Labor cost"]', 0, 'Labor turnover rate = (Number of leavers / Average number of employees) × 100.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_lab_005', 'subj_wassce_cost_accounting', 'topic_ca_labor', 'Idle time is:', '["Time spent working","Time workers are paid but not productive","Overtime hours","Break time only"]', 1, 'Idle time is time for which workers are paid but are not producing due to machine breakdown, waiting for materials, etc.', 'easy', 'multiple_choice', datetime('now'));

-- Overhead Costing (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_oh_002', 'subj_wassce_cost_accounting', 'topic_ca_overhead', 'Apportionment of overheads is done when:', '["Costs can be directly traced","Costs are shared between cost centers","There is only one department","Costs are ignored"]', 1, 'Apportionment distributes common costs between departments based on appropriate bases.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_oh_003', 'subj_wassce_cost_accounting', 'topic_ca_overhead', 'Absorption rate is calculated as:', '["Total overhead ÷ Activity level","Revenue ÷ Cost","Profit × 100","Materials + Labor"]', 0, 'Overhead Absorption Rate = Budgeted Overhead / Budgeted Activity Level (labor hours, machine hours, etc.).', 'medium', 'multiple_choice', datetime('now')),
('q_ca_oh_004', 'subj_wassce_cost_accounting', 'topic_ca_overhead', 'Under-absorption of overhead occurs when:', '["Actual overhead is less than absorbed","Actual overhead exceeds absorbed overhead","Overheads equal absorption","There are no overheads"]', 1, 'Under-absorption occurs when actual overheads are greater than the amount absorbed/recovered.', 'hard', 'multiple_choice', datetime('now')),
('q_ca_oh_005', 'subj_wassce_cost_accounting', 'topic_ca_overhead', 'Machine hour rate is appropriate when:', '["Production is labor-intensive","Production is machine-intensive","There are no machines","Only in service industries"]', 1, 'Machine hour rate is used when production is predominantly machine-based.', 'medium', 'multiple_choice', datetime('now'));

-- Budgeting (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_bud_002', 'subj_wassce_cost_accounting', 'topic_ca_budgeting', 'A flexible budget:', '["Remains fixed regardless of output","Adjusts for different activity levels","Is prepared after the period","Ignores variable costs"]', 1, 'A flexible budget adjusts budgeted figures for the actual level of activity achieved.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_bud_003', 'subj_wassce_cost_accounting', 'topic_ca_budgeting', 'A favorable variance occurs when:', '["Actual cost exceeds budget","Actual cost is less than budget","Budget equals actual","There is no variance"]', 1, 'A favorable variance means actual results are better than budgeted (lower costs or higher revenue).', 'easy', 'multiple_choice', datetime('now')),
('q_ca_bud_004', 'subj_wassce_cost_accounting', 'topic_ca_budgeting', 'Zero-based budgeting requires:', '["Using last year''s budget as a base","Justifying all expenses from zero","Only budgeting new items","Ignoring historical data completely"]', 1, 'Zero-based budgeting starts from zero, requiring justification for every expense regardless of past budgets.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_bud_005', 'subj_wassce_cost_accounting', 'topic_ca_budgeting', 'The master budget includes:', '["Only cash budget","All functional budgets combined","Only sales budget","Only production budget"]', 1, 'The master budget consolidates all individual departmental/functional budgets into one comprehensive plan.', 'medium', 'multiple_choice', datetime('now'));

-- Costing Methods (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ca_meth_002', 'subj_wassce_cost_accounting', 'topic_ca_costing', 'Job costing is suitable for:', '["Mass production","Custom or unique orders","Continuous production","Identical products"]', 1, 'Job costing is used when products are made to customer specifications or are unique.', 'easy', 'multiple_choice', datetime('now')),
('q_ca_meth_003', 'subj_wassce_cost_accounting', 'topic_ca_costing', 'Process costing is used when:', '["Each product is unique","Products pass through continuous processes","Only one product is made","There is no production"]', 1, 'Process costing is used for continuous production where products are identical and pass through defined processes.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_meth_004', 'subj_wassce_cost_accounting', 'topic_ca_costing', 'Marginal costing treats fixed costs as:', '["Product costs","Period costs","Variable costs","Direct costs"]', 1, 'In marginal costing, fixed costs are treated as period costs charged entirely against the period''s revenue.', 'medium', 'multiple_choice', datetime('now')),
('q_ca_meth_005', 'subj_wassce_cost_accounting', 'topic_ca_costing', 'Contribution margin equals:', '["Sales - Fixed costs","Sales - Variable costs","Fixed costs - Variable costs","Total costs - Sales"]', 1, 'Contribution = Sales Revenue - Variable Costs. It contributes towards covering fixed costs and profit.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- TECHNICAL DRAWING - Additional Questions (7 topics × 5 = 35 questions)
-- =============================================

-- Drawing Basics (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_td_bas_002', 'subj_wassce_tech_drawing', 'topic_td_basics', 'A 2H pencil is:', '["Softer than HB","Harder than HB","Same as HB","Not used in drawing"]', 1, 'Pencils with H ratings are harder than HB. 2H is harder than H, making it suitable for fine lines.', 'easy', 'multiple_choice', datetime('now')),
('q_td_bas_003', 'subj_wassce_tech_drawing', 'topic_td_basics', 'A T-square is used for drawing:', '["Circles","Horizontal lines","Curves","Freehand sketches"]', 1, 'A T-square is used to draw horizontal lines and as a guide for set squares.', 'easy', 'multiple_choice', datetime('now')),
('q_td_bas_004', 'subj_wassce_tech_drawing', 'topic_td_basics', 'The scale 1:2 means:', '["Drawing is twice actual size","Drawing is half actual size","Drawing equals actual size","Drawing is quarter actual size"]', 1, 'Scale 1:2 means 1 unit on drawing represents 2 units in reality, so the drawing is half size.', 'medium', 'multiple_choice', datetime('now')),
('q_td_bas_005', 'subj_wassce_tech_drawing', 'topic_td_basics', 'Construction lines should be:', '["Very dark","Very light and thin","Thick","Colored"]', 1, 'Construction lines should be very light so they can be erased or don''t show in the final drawing.', 'easy', 'multiple_choice', datetime('now'));

-- Geometric Constructions (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_td_geo_002', 'subj_wassce_tech_drawing', 'topic_td_geometry', 'A hexagon has:', '["5 sides","6 sides","7 sides","8 sides"]', 1, 'A hexagon is a six-sided polygon. "Hex" means six in Greek.', 'easy', 'multiple_choice', datetime('now')),
('q_td_geo_003', 'subj_wassce_tech_drawing', 'topic_td_geometry', 'To bisect a line means to:', '["Double its length","Divide it into two equal parts","Triple its length","Erase it"]', 1, 'Bisecting divides a line or angle into two equal parts.', 'easy', 'multiple_choice', datetime('now')),
('q_td_geo_004', 'subj_wassce_tech_drawing', 'topic_td_geometry', 'A tangent to a circle:', '["Passes through the center","Touches the circle at exactly one point","Cuts the circle at two points","Never touches the circle"]', 1, 'A tangent is a line that touches a circle at exactly one point (point of tangency).', 'medium', 'multiple_choice', datetime('now')),
('q_td_geo_005', 'subj_wassce_tech_drawing', 'topic_td_geometry', 'The interior angles of a triangle sum to:', '["90°","180°","270°","360°"]', 1, 'The sum of interior angles in any triangle is always 180 degrees.', 'easy', 'multiple_choice', datetime('now'));

-- Orthographic Projection (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_td_ort_002', 'subj_wassce_tech_drawing', 'topic_td_orthographic', 'In orthographic projection, objects are viewed from:', '["One angle only","Multiple perpendicular directions","Oblique angles","Above only"]', 1, 'Orthographic projection shows objects from perpendicular directions: front, top, and side views.', 'medium', 'multiple_choice', datetime('now')),
('q_td_ort_003', 'subj_wassce_tech_drawing', 'topic_td_orthographic', 'The plan view shows the object from:', '["The front","The side","Above (top)","An angle"]', 2, 'The plan view (top view) shows the object as seen from directly above.', 'easy', 'multiple_choice', datetime('now')),
('q_td_ort_004', 'subj_wassce_tech_drawing', 'topic_td_orthographic', 'Hidden edges in orthographic drawing are shown as:', '["Continuous lines","Dashed lines","Chain lines","No lines"]', 1, 'Hidden edges (not visible from the viewing direction) are represented by dashed (broken) lines.', 'easy', 'multiple_choice', datetime('now')),
('q_td_ort_005', 'subj_wassce_tech_drawing', 'topic_td_orthographic', 'Third angle projection places the plan view:', '["Below the front elevation","Above the front elevation","To the left","Not at all"]', 1, 'In third angle projection, the plan (top view) is placed above the front elevation.', 'medium', 'multiple_choice', datetime('now'));

-- Pictorial Drawing (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_td_pic_002', 'subj_wassce_tech_drawing', 'topic_td_isometric', 'Oblique drawing shows:', '["All sides equally","Front view true shape, depth at an angle","Only one side","Perspective view"]', 1, 'Oblique drawing shows the front face in true shape with depth lines drawn at 30° or 45°.', 'medium', 'multiple_choice', datetime('now')),
('q_td_pic_003', 'subj_wassce_tech_drawing', 'topic_td_isometric', 'In isometric drawing, circles appear as:', '["Perfect circles","Ellipses","Squares","Triangles"]', 1, 'Circles in isometric drawing appear as ellipses because of the angular projection.', 'medium', 'multiple_choice', datetime('now')),
('q_td_pic_004', 'subj_wassce_tech_drawing', 'topic_td_isometric', 'Perspective drawing creates:', '["Equal parallel lines","Illusion of depth with converging lines","No depth","Flat images only"]', 1, 'Perspective drawing creates realistic depth by having parallel lines converge toward vanishing points.', 'medium', 'multiple_choice', datetime('now')),
('q_td_pic_005', 'subj_wassce_tech_drawing', 'topic_td_isometric', 'Cabinet oblique uses a depth scale of:', '["Full scale","Half scale","Quarter scale","Double scale"]', 1, 'Cabinet oblique uses half scale (1:2) for the receding axis to reduce distortion.', 'medium', 'multiple_choice', datetime('now'));

-- Sections and Developments (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_td_sec_001', 'subj_wassce_tech_drawing', 'topic_td_sections', 'A sectional view shows:', '["The outside of an object","Internal features by cutting through the object","Only the top","Only hidden lines"]', 1, 'Sectional views reveal internal details by showing the object as if cut by an imaginary plane.', 'easy', 'multiple_choice', datetime('now')),
('q_td_sec_002', 'subj_wassce_tech_drawing', 'topic_td_sections', 'Hatching lines in sections are drawn at:', '["90° to the outline","45° to the horizontal","0°","Randomly"]', 1, 'Section hatching is typically drawn at 45° to the horizontal outline of the cut surface.', 'easy', 'multiple_choice', datetime('now')),
('q_td_sec_003', 'subj_wassce_tech_drawing', 'topic_td_sections', 'A full section cuts:', '["A quarter of the object","Half the object","Completely through the object","Around the object"]', 2, 'A full section passes completely through the object along a cutting plane.', 'easy', 'multiple_choice', datetime('now')),
('q_td_sec_004', 'subj_wassce_tech_drawing', 'topic_td_sections', 'Surface development shows:', '["3D view of an object","Unfolded/flat pattern of a 3D object","Only the front","Cross-section only"]', 1, 'Surface development shows the unfolded (flat) pattern that can be folded to create a 3D object.', 'medium', 'multiple_choice', datetime('now')),
('q_td_sec_005', 'subj_wassce_tech_drawing', 'topic_td_sections', 'A half section shows:', '["Full exterior view","Half in section, half in exterior view","Only internal features","Two complete sections"]', 1, 'A half section shows one half of the object in section and the other half in exterior view.', 'medium', 'multiple_choice', datetime('now'));

-- Building Drawing (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_td_bld_002', 'subj_wassce_tech_drawing', 'topic_td_building', 'An elevation shows:', '["The view from above","The vertical view of a building face","The foundation only","The roof only"]', 1, 'An elevation shows the vertical/side view of a building''s exterior face.', 'easy', 'multiple_choice', datetime('now')),
('q_td_bld_003', 'subj_wassce_tech_drawing', 'topic_td_building', 'The foundation plan shows:', '["Room layout","Structure below ground level","Roof design","Electrical wiring"]', 1, 'A foundation plan shows the concrete footings and structure below ground level.', 'medium', 'multiple_choice', datetime('now')),
('q_td_bld_004', 'subj_wassce_tech_drawing', 'topic_td_building', 'A site plan shows:', '["Interior design","Location of building on the plot","Only the roof","Furniture layout"]', 1, 'A site plan shows the position and orientation of a building on its plot/site.', 'easy', 'multiple_choice', datetime('now')),
('q_td_bld_005', 'subj_wassce_tech_drawing', 'topic_td_building', 'DPC stands for:', '["Drawing Plan Copy","Damp Proof Course","Direct Planning Center","Design Production Control"]', 1, 'DPC (Damp Proof Course) is a waterproof layer preventing moisture from rising through walls.', 'medium', 'multiple_choice', datetime('now'));

-- Machine Drawing (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_td_mch_001', 'subj_wassce_tech_drawing', 'topic_td_machine', 'A thread is used for:', '["Decoration only","Joining parts together","Measuring length","Drawing circles"]', 1, 'Screw threads are used to join parts together and transmit motion or force.', 'easy', 'multiple_choice', datetime('now')),
('q_td_mch_002', 'subj_wassce_tech_drawing', 'topic_td_machine', 'A bolt differs from a screw in that a bolt:', '["Has no threads","Requires a nut","Is always smaller","Cannot be removed"]', 1, 'A bolt passes through parts and is secured with a nut, while a screw threads directly into material.', 'medium', 'multiple_choice', datetime('now')),
('q_td_mch_003', 'subj_wassce_tech_drawing', 'topic_td_machine', 'A washer is used to:', '["Cut materials","Distribute load and prevent damage","Measure angles","Join pipes"]', 1, 'Washers distribute the load of a fastener and prevent damage to the surface.', 'easy', 'multiple_choice', datetime('now')),
('q_td_mch_004', 'subj_wassce_tech_drawing', 'topic_td_machine', 'A key in machine drawing is used to:', '["Lock doors","Prevent relative rotation between shaft and hub","Tighten bolts","Measure diameter"]', 1, 'A key prevents relative rotation between a shaft and the component mounted on it.', 'medium', 'multiple_choice', datetime('now')),
('q_td_mch_005', 'subj_wassce_tech_drawing', 'topic_td_machine', 'Conventional representation of threads shows:', '["Actual thread profile","Simplified lines representing threads","No threads","Only external threads"]', 1, 'Conventional representation uses simplified thin and thick lines to represent threads.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- FRENCH - Additional Questions (6 topics)
-- =============================================

-- French Grammar (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fr_gram_002', 'subj_wassce_french', 'topic_fr_grammar', 'The past tense of "aller" (to go) in first person is:', '["je vais","j''allais","je suis allé(e)","j''irai"]', 2, 'Je suis allé(e) is the passé composé (past tense). "J''allais" is imperfect, "j''irai" is future.', 'medium', 'multiple_choice', datetime('now')),
('q_fr_gram_003', 'subj_wassce_french', 'topic_fr_grammar', 'Which is a feminine noun?', '["le livre","le stylo","la table","le cahier"]', 2, 'La table is feminine (la). Le livre, le stylo, and le cahier are masculine (le).', 'easy', 'multiple_choice', datetime('now')),
('q_fr_gram_004', 'subj_wassce_french', 'topic_fr_grammar', '"Nous mangeons" means:', '["We eat","They eat","You eat","I eat"]', 0, 'Nous = we, mangeons = eat (first person plural of manger).', 'easy', 'multiple_choice', datetime('now')),
('q_fr_gram_005', 'subj_wassce_french', 'topic_fr_grammar', 'The negative form of "Je parle" is:', '["Je parle pas","Je ne parle pas","Je pas parle","Ne je parle pas"]', 1, 'French negation uses ne...pas around the verb: Je ne parle pas.', 'easy', 'multiple_choice', datetime('now'));

-- French Vocabulary (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fr_voc_002', 'subj_wassce_french', 'topic_fr_vocabulary', 'Comment dit-on "school" en français?', '["maison","école","hôpital","église"]', 1, 'École means school. Maison=house, hôpital=hospital, église=church.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_voc_003', 'subj_wassce_french', 'topic_fr_vocabulary', '"Aujourd''hui" means:', '["Yesterday","Tomorrow","Today","Always"]', 2, 'Aujourd''hui means today. Hier=yesterday, demain=tomorrow.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_voc_004', 'subj_wassce_french', 'topic_fr_vocabulary', 'The French word for "water" is:', '["pain","lait","eau","jus"]', 2, 'Eau means water. Pain=bread, lait=milk, jus=juice.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_voc_005', 'subj_wassce_french', 'topic_fr_vocabulary', '"Frère" and "sœur" mean:', '["Father and mother","Brother and sister","Son and daughter","Uncle and aunt"]', 1, 'Frère = brother, sœur = sister.', 'easy', 'multiple_choice', datetime('now'));

-- French Reading Comprehension (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fr_read_001', 'subj_wassce_french', 'topic_fr_reading', 'In French reading, "Il fait beau" describes:', '["Bad weather","Good weather","Cold weather","Rainy weather"]', 1, 'Il fait beau means the weather is nice/beautiful.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_read_002', 'subj_wassce_french', 'topic_fr_reading', '"Marie a quinze ans" means Marie is:', '["15 years old","50 years old","5 years old","25 years old"]', 0, 'Quinze = 15. "A...ans" means "is...years old".', 'easy', 'multiple_choice', datetime('now')),
('q_fr_read_003', 'subj_wassce_french', 'topic_fr_reading', '"Il habite à Paris" means:', '["He works in Paris","He lives in Paris","He visits Paris","He leaves Paris"]', 1, 'Habiter = to live. Il habite = he lives.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_read_004', 'subj_wassce_french', 'topic_fr_reading', 'When you see "parce que" in a text, it indicates:', '["Time","Reason/Because","Place","Manner"]', 1, 'Parce que means "because" and introduces a reason.', 'medium', 'multiple_choice', datetime('now')),
('q_fr_read_005', 'subj_wassce_french', 'topic_fr_reading', '"Chaque jour" in a passage means:', '["Some days","Every day","One day","No day"]', 1, 'Chaque = each/every. Chaque jour = every day.', 'easy', 'multiple_choice', datetime('now'));

-- French Writing (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fr_writ_001', 'subj_wassce_french', 'topic_fr_writing', 'A formal French letter begins with:', '["Salut","Cher ami","Monsieur/Madame","Bonjour mon ami"]', 2, 'Formal letters use Monsieur/Madame. Salut and Cher ami are informal.', 'medium', 'multiple_choice', datetime('now')),
('q_fr_writ_002', 'subj_wassce_french', 'topic_fr_writing', 'To end a formal letter, you write:', '["Bisous","À bientôt","Veuillez agréer mes salutations distinguées","Salut"]', 2, 'Formal closing uses "Veuillez agréer..." Others are informal.', 'medium', 'multiple_choice', datetime('now')),
('q_fr_writ_003', 'subj_wassce_french', 'topic_fr_writing', 'In French, the date is written as:', '["Month, day, year","Day, month, year","Year, month, day","Day, year, month"]', 1, 'French dates use day, month, year format: le 15 janvier 2024.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_writ_004', 'subj_wassce_french', 'topic_fr_writing', 'An informal letter to a friend starts with:', '["Monsieur","Cher/Chère + name","Madame","À qui de droit"]', 1, 'Informal letters use Cher (dear) + the person''s name.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_writ_005', 'subj_wassce_french', 'topic_fr_writing', 'To express an opinion in French, you can use:', '["Je pense que...","Il fait...","Il y a...","C''est..."]', 0, 'Je pense que (I think that) introduces an opinion.', 'medium', 'multiple_choice', datetime('now'));

-- French Culture (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fr_cul_002', 'subj_wassce_french', 'topic_fr_culture', 'The French national holiday is on:', '["July 4","July 14","January 1","December 25"]', 1, 'Bastille Day (la fête nationale) is celebrated on July 14.', 'medium', 'multiple_choice', datetime('now')),
('q_fr_cul_003', 'subj_wassce_french', 'topic_fr_culture', 'Which African country is francophone?', '["Nigeria","Ghana","Côte d''Ivoire","Kenya"]', 2, 'Côte d''Ivoire (Ivory Coast) is a French-speaking (francophone) country.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_cul_004', 'subj_wassce_french', 'topic_fr_culture', 'The Eiffel Tower is located in:', '["Lyon","Marseille","Paris","Nice"]', 2, 'The Eiffel Tower is the iconic landmark of Paris.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_cul_005', 'subj_wassce_french', 'topic_fr_culture', 'French people typically greet with:', '["A handshake only","La bise (kisses on cheeks)","A bow","Waving"]', 1, 'The French commonly greet with "la bise" - kisses on the cheeks (number varies by region).', 'easy', 'multiple_choice', datetime('now'));

-- French Oral Communication (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fr_oral_001', 'subj_wassce_french', 'topic_fr_oral', 'To ask "How are you?" formally in French:', '["Ça va?","Comment allez-vous?","Tu vas bien?","Quoi de neuf?"]', 1, 'Comment allez-vous? is the formal way. Ça va? is informal.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_oral_002', 'subj_wassce_french', 'topic_fr_oral', 'To introduce yourself, you say:', '["Je m''appelle...","Tu t''appelles...","Il s''appelle...","Vous vous appelez..."]', 0, 'Je m''appelle = My name is / I am called.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_oral_003', 'subj_wassce_french', 'topic_fr_oral', '"Excusez-moi" is used to:', '["Say thank you","Apologize or get attention","Say goodbye","Ask for directions only"]', 1, 'Excusez-moi means excuse me, used to apologize or politely get attention.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_oral_004', 'subj_wassce_french', 'topic_fr_oral', 'To ask for the price, you say:', '["C''est combien?","C''est quoi?","C''est où?","C''est quand?"]', 0, 'C''est combien? = How much is it? Combien = how much.', 'easy', 'multiple_choice', datetime('now')),
('q_fr_oral_005', 'subj_wassce_french', 'topic_fr_oral', '"Je ne comprends pas" means:', '["I don''t know","I don''t understand","I don''t like","I don''t want"]', 1, 'Comprendre = to understand. Je ne comprends pas = I don''t understand.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- TWI - Additional Questions (5 topics)
-- =============================================

-- Twi Grammar (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_twi_gram_002', 'subj_wassce_twi', 'topic_twi_grammar', '"Mekɔ sukuu" means:', '["I go to school","I am at school","I left school","I like school"]', 0, 'Me = I, kɔ = go, sukuu = school. Mekɔ sukuu = I go to school.', 'easy', 'multiple_choice', datetime('now')),
('q_twi_gram_003', 'subj_wassce_twi', 'topic_twi_grammar', 'The plural marker in Twi is often:', '["a-","n-/m-","e-","o-"]', 1, 'Many Twi plurals are formed with the n- or m- prefix.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_gram_004', 'subj_wassce_twi', 'topic_twi_grammar', '"Yɛn" in Twi means:', '["You (singular)","They","We/Us","He/She"]', 2, 'Yɛn = we/us (first person plural pronoun).', 'easy', 'multiple_choice', datetime('now')),
('q_twi_gram_005', 'subj_wassce_twi', 'topic_twi_grammar', 'To form a question in Twi, you typically:', '["Add ''anaa'' at the end","Change word order completely","Always use ''sɛn''","Add ''na'' at the beginning"]', 0, 'Questions in Twi often end with "anaa" for yes/no questions.', 'medium', 'multiple_choice', datetime('now'));

-- Twi Vocabulary (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_twi_voc_002', 'subj_wassce_twi', 'topic_twi_vocabulary', '"Ɛda" in Twi means:', '["Day","Night","Week","Month"]', 0, 'Ɛda = day. Anadwo = night.', 'easy', 'multiple_choice', datetime('now')),
('q_twi_voc_003', 'subj_wassce_twi', 'topic_twi_vocabulary', 'The Twi word for "food" is:', '["Nsuo","Aduane","Ntoma","Fie"]', 1, 'Aduane = food. Nsuo = water, Ntoma = cloth, Fie = house.', 'easy', 'multiple_choice', datetime('now')),
('q_twi_voc_004', 'subj_wassce_twi', 'topic_twi_vocabulary', '"Medaase" is used to say:', '["Hello","Goodbye","Thank you","Please"]', 2, 'Medaase = Thank you (I lie down for you).', 'easy', 'multiple_choice', datetime('now')),
('q_twi_voc_005', 'subj_wassce_twi', 'topic_twi_vocabulary', 'The numbers "baako, mmienu, mmiɛnsa" mean:', '["1, 2, 3","4, 5, 6","10, 20, 30","7, 8, 9"]', 0, 'Baako = 1, Mmienu = 2, Mmiɛnsa = 3.', 'easy', 'multiple_choice', datetime('now'));

-- Twi Comprehension (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_twi_comp_001', 'subj_wassce_twi', 'topic_twi_comprehension', 'In Twi passages, "enti" indicates:', '["Time","Reason/Therefore","Place","Manner"]', 1, 'Enti means therefore/so, indicating cause and effect.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_comp_002', 'subj_wassce_twi', 'topic_twi_comprehension', '"Ɛberɛ a" in a passage introduces:', '["A place","A time/When","A person","A reason"]', 1, 'Ɛberɛ a = when/at the time that. Introduces time clauses.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_comp_003', 'subj_wassce_twi', 'topic_twi_comprehension', 'The word "nanso" in a text means:', '["And","But/However","Because","Or"]', 1, 'Nanso = but/however, showing contrast in meaning.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_comp_004', 'subj_wassce_twi', 'topic_twi_comprehension', '"Ɔpanyin" in a story refers to:', '["A child","An elder/adult","A woman","A stranger"]', 1, 'Ɔpanyin = an elder or elderly person (term of respect).', 'easy', 'multiple_choice', datetime('now')),
('q_twi_comp_005', 'subj_wassce_twi', 'topic_twi_comprehension', 'When a passage mentions "ɔman," it refers to:', '["A house","A town/nation","A river","A market"]', 1, 'Ɔman = town, nation, or state.', 'easy', 'multiple_choice', datetime('now'));

-- Twi Composition (5 needed - has 0)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_twi_compos_001', 'subj_wassce_twi', 'topic_twi_composition', 'A formal Twi letter begins with:', '["Agya panyin","Me dɔfo","Owura/Awura","Adamfo"]', 2, 'Owura (Mr.) / Awura (Mrs.) is used for formal letters.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_compos_002', 'subj_wassce_twi', 'topic_twi_composition', 'To conclude a Twi essay, you can use:', '["Enti...","Ɛberɛ a...","Saa enti...","Nanso..."]', 2, 'Saa enti = therefore/in conclusion, summarizes the main point.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_compos_003', 'subj_wassce_twi', 'topic_twi_composition', 'In descriptive writing, "ne ho yɛ" describes:', '["Location","Appearance/Beauty","Time","Sound"]', 1, 'Ne ho yɛ fɛ = is beautiful. Used to describe appearance.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_compos_004', 'subj_wassce_twi', 'topic_twi_composition', 'To express sequence in writing, use:', '["Kane...afei...akyiri no","Nanso","Enti","Anaa"]', 0, 'Kane = first, Afei = then, Akyiri no = finally - shows sequence.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_compos_005', 'subj_wassce_twi', 'topic_twi_composition', 'A narrative essay in Twi is called:', '["Kasamu","Anansesɛm/Nsɛm a ɛkɔɔ so","Amammerɛ","Kasahyɛ"]', 1, 'Anansesɛm or Nsɛm a ɛkɔɔ so = story/narrative.', 'medium', 'multiple_choice', datetime('now'));

-- Akan Culture (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_twi_cul_002', 'subj_wassce_twi', 'topic_twi_culture', 'The Gye Nyame symbol represents:', '["Power of chiefs","Supremacy of God","Unity","Strength"]', 1, 'Gye Nyame means "Except God" - representing God''s omnipotence.', 'easy', 'multiple_choice', datetime('now')),
('q_twi_cul_003', 'subj_wassce_twi', 'topic_twi_culture', 'Kente cloth is traditionally worn during:', '["Funerals only","Important ceremonies and festivals","Everyday activities","Farming"]', 1, 'Kente is worn during special occasions like festivals, weddings, and ceremonies.', 'easy', 'multiple_choice', datetime('now')),
('q_twi_cul_004', 'subj_wassce_twi', 'topic_twi_culture', 'The Akan naming ceremony is held:', '["At birth","On the 8th day after birth","After one year","At puberty"]', 1, 'The outdooring/naming ceremony (din to) is traditionally on the 8th day.', 'medium', 'multiple_choice', datetime('now')),
('q_twi_cul_005', 'subj_wassce_twi', 'topic_twi_culture', 'In Akan society, inheritance is typically:', '["Patrilineal","Matrilineal","Bilateral","Through eldest child"]', 1, 'Akan inheritance is matrilineal - through the mother''s line.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- BECE MATHEMATICS - Additional Questions (4 topics × 5 = 20 questions)
-- =============================================

-- Numbers and Numeration (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_num_001', 'subj_bece_math', 'topic_bece_numbers', 'What is 3/4 expressed as a percentage?', '["25%","50%","75%","80%"]', 2, '3/4 = 0.75 = 75%. Multiply fraction by 100.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_num_002', 'subj_bece_math', 'topic_bece_numbers', 'Find the LCM of 12 and 18:', '["6","36","72","216"]', 1, 'LCM(12,18) = 36. The smallest number divisible by both 12 and 18.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_num_003', 'subj_bece_math', 'topic_bece_numbers', 'Round 3,847 to the nearest hundred:', '["3,800","3,850","3,900","4,000"]', 0, '3,847 rounds down to 3,800 (47 < 50).', 'easy', 'multiple_choice', datetime('now')),
('q_bece_num_004', 'subj_bece_math', 'topic_bece_numbers', 'What is 15% of 200?', '["15","30","45","300"]', 1, '15% of 200 = 0.15 × 200 = 30.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_num_005', 'subj_bece_math', 'topic_bece_numbers', 'Express 0.625 as a fraction in lowest terms:', '["5/8","6/10","625/1000","3/5"]', 0, '0.625 = 625/1000 = 5/8 when reduced to lowest terms.', 'medium', 'multiple_choice', datetime('now'));

-- Basic Algebra (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_alg_001', 'subj_bece_math', 'topic_bece_algebra', 'Solve for x: 3x + 7 = 22', '["3","5","7","15"]', 1, '3x + 7 = 22 → 3x = 15 → x = 5.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_alg_002', 'subj_bece_math', 'topic_bece_algebra', 'Simplify: 2(3x + 4) - 5x', '["x + 8","6x + 8","x - 8","11x"]', 0, '2(3x + 4) - 5x = 6x + 8 - 5x = x + 8.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_alg_003', 'subj_bece_math', 'topic_bece_algebra', 'If y = 2x - 3, find y when x = 4:', '["5","8","11","2"]', 0, 'y = 2(4) - 3 = 8 - 3 = 5.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_alg_004', 'subj_bece_math', 'topic_bece_algebra', 'Solve: x/3 = 12', '["4","9","36","15"]', 2, 'x/3 = 12 → x = 12 × 3 = 36.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_alg_005', 'subj_bece_math', 'topic_bece_algebra', 'What is the value of 2a² when a = 3?', '["6","12","18","36"]', 2, '2a² = 2 × 3² = 2 × 9 = 18.', 'medium', 'multiple_choice', datetime('now'));

-- Geometry and Measurement (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_geo_001', 'subj_bece_math', 'topic_bece_geometry', 'The area of a rectangle with length 8cm and width 5cm is:', '["13 cm²","26 cm²","40 cm²","80 cm²"]', 2, 'Area = length × width = 8 × 5 = 40 cm².', 'easy', 'multiple_choice', datetime('now')),
('q_bece_geo_002', 'subj_bece_math', 'topic_bece_geometry', 'How many degrees are in a right angle?', '["45°","90°","180°","360°"]', 1, 'A right angle measures exactly 90 degrees.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_geo_003', 'subj_bece_math', 'topic_bece_geometry', 'The perimeter of a square with side 6cm is:', '["12 cm","24 cm","36 cm","6 cm"]', 1, 'Perimeter = 4 × side = 4 × 6 = 24 cm.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_geo_004', 'subj_bece_math', 'topic_bece_geometry', 'The circumference of a circle with radius 7cm is (use π = 22/7):', '["22 cm","44 cm","154 cm","14 cm"]', 1, 'Circumference = 2πr = 2 × 22/7 × 7 = 44 cm.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_geo_005', 'subj_bece_math', 'topic_bece_geometry', 'An isosceles triangle has:', '["No equal sides","Two equal sides","Three equal sides","Four equal sides"]', 1, 'An isosceles triangle has exactly two equal sides.', 'easy', 'multiple_choice', datetime('now'));

-- Statistics and Probability (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_stat_001', 'subj_bece_math', 'topic_bece_statistics', 'Find the mean of: 4, 6, 8, 10, 12', '["6","8","10","40"]', 1, 'Mean = (4+6+8+10+12)/5 = 40/5 = 8.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_stat_002', 'subj_bece_math', 'topic_bece_statistics', 'The mode of 2, 3, 3, 4, 5, 3, 6 is:', '["2","3","4","5"]', 1, 'Mode is the most frequent value. 3 appears 3 times.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_stat_003', 'subj_bece_math', 'topic_bece_statistics', 'The median of 1, 3, 5, 7, 9 is:', '["3","5","7","25"]', 1, 'Median is the middle value. In this ordered set, it is 5.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_stat_004', 'subj_bece_math', 'topic_bece_statistics', 'A fair coin is tossed. The probability of getting heads is:', '["0","1/4","1/2","1"]', 2, 'A fair coin has two equally likely outcomes. P(heads) = 1/2.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_stat_005', 'subj_bece_math', 'topic_bece_statistics', 'In a class of 40 students, 25 are girls. What fraction are boys?', '["5/8","3/8","25/40","15/25"]', 1, 'Boys = 40 - 25 = 15. Fraction = 15/40 = 3/8.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- BECE ENGLISH - Additional Questions (4 topics × 5 = 20 questions)
-- =============================================

-- Grammar and Structure (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_gram_001', 'subj_bece_english', 'topic_bece_grammar', 'Identify the noun in: "The cat sat on the mat."', '["sat","on","cat","the"]', 2, 'Cat is a noun (naming word for a person, place, thing, or animal).', 'easy', 'multiple_choice', datetime('now')),
('q_bece_gram_002', 'subj_bece_english', 'topic_bece_grammar', 'Which sentence is in the past tense?', '["She sings well","She sang well","She will sing well","She is singing well"]', 1, 'Sang is the past tense of sing.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_gram_003', 'subj_bece_english', 'topic_bece_grammar', 'Choose the correct pronoun: "___ went to the market."', '["Him","Her","She","Me"]', 2, 'She is a subject pronoun. Him, Her, Me are object pronouns.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_gram_004', 'subj_bece_english', 'topic_bece_grammar', 'The plural of "child" is:', '["childs","childes","children","childrens"]', 2, 'Child has an irregular plural: children.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_gram_005', 'subj_bece_english', 'topic_bece_grammar', 'Which word is an adjective in: "The big dog barked loudly"?', '["dog","barked","big","loudly"]', 2, 'Big describes the noun dog, making it an adjective.', 'easy', 'multiple_choice', datetime('now'));

-- Reading Comprehension (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_comp_001', 'subj_bece_english', 'topic_bece_comprehension', 'The main idea of a passage is:', '["The first sentence","What the passage is mainly about","The last sentence","A detail in the passage"]', 1, 'The main idea is the central point or message of the entire passage.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_comp_002', 'subj_bece_english', 'topic_bece_comprehension', 'Context clues help readers to:', '["Skip words","Understand unfamiliar words","Read faster","Count words"]', 1, 'Context clues are hints in the text that help determine word meanings.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_comp_003', 'subj_bece_english', 'topic_bece_comprehension', 'A summary should include:', '["Every detail","Only the main points","Only dialogue","Personal opinions"]', 1, 'A summary captures the main points without unnecessary details.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_comp_004', 'subj_bece_english', 'topic_bece_comprehension', 'Making inferences means:', '["Reading exactly what is written","Drawing conclusions from clues","Summarizing the text","Finding the title"]', 1, 'Inference is reading between the lines using evidence and reasoning.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_comp_005', 'subj_bece_english', 'topic_bece_comprehension', 'The setting of a story tells us:', '["The characters only","When and where the story takes place","The moral lesson","The author''s name"]', 1, 'Setting refers to the time and place of a story.', 'easy', 'multiple_choice', datetime('now'));

-- Vocabulary and Spelling (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_voc_001', 'subj_bece_english', 'topic_bece_vocabulary', 'A synonym for "happy" is:', '["sad","angry","joyful","tired"]', 2, 'Joyful means the same as happy (synonym).', 'easy', 'multiple_choice', datetime('now')),
('q_bece_voc_002', 'subj_bece_english', 'topic_bece_vocabulary', 'An antonym for "hot" is:', '["warm","cold","heat","burning"]', 1, 'Cold is the opposite of hot (antonym).', 'easy', 'multiple_choice', datetime('now')),
('q_bece_voc_003', 'subj_bece_english', 'topic_bece_vocabulary', 'Which spelling is correct?', '["recieve","receive","recive","receeve"]', 1, 'Receive follows the "i before e except after c" rule.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_voc_004', 'subj_bece_english', 'topic_bece_vocabulary', '"Beautiful" means:', '["ugly","pretty","fast","slow"]', 1, 'Beautiful means pretty or attractive.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_voc_005', 'subj_bece_english', 'topic_bece_vocabulary', 'A homophone of "see" is:', '["sea","saw","seen","seeing"]', 0, 'Sea sounds the same as see but has a different meaning (homophone).', 'medium', 'multiple_choice', datetime('now'));

-- Essay and Composition (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_essay_001', 'subj_bece_english', 'topic_bece_composition', 'A formal letter should include:', '["Slang expressions","Your address and date","Emojis","Nicknames"]', 1, 'Formal letters require proper format including sender''s address and date.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_essay_002', 'subj_bece_english', 'topic_bece_composition', 'A narrative essay tells:', '["Facts only","A story","Opinions only","Instructions"]', 1, 'Narrative essays tell a story with characters, setting, and plot.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_essay_003', 'subj_bece_english', 'topic_bece_composition', 'The introduction of an essay should:', '["State the conclusion","Introduce the topic","List all points in detail","Be the longest paragraph"]', 1, 'The introduction presents the topic and captures reader interest.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_essay_004', 'subj_bece_english', 'topic_bece_composition', 'Which salutation is correct for a formal letter?', '["Hi there","Dear Sir/Madam","Hey","What''s up"]', 1, 'Dear Sir/Madam is the appropriate formal salutation.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_essay_005', 'subj_bece_english', 'topic_bece_composition', 'A topic sentence usually appears:', '["At the end of a paragraph","At the beginning of a paragraph","Only in conclusions","In the middle only"]', 1, 'Topic sentences typically begin paragraphs, stating the main idea.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- BECE INTEGRATED SCIENCE - Additional Questions (4 topics × 5 = 20 questions)
-- =============================================

-- Living Things (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_liv_001', 'subj_bece_science', 'topic_bece_living', 'The basic unit of life is:', '["Tissue","Organ","Cell","System"]', 2, 'The cell is the basic structural and functional unit of all living things.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_liv_002', 'subj_bece_science', 'topic_bece_living', 'Plants make their own food through:', '["Respiration","Photosynthesis","Digestion","Excretion"]', 1, 'Photosynthesis is the process by which plants make food using sunlight.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_liv_003', 'subj_bece_science', 'topic_bece_living', 'The organ that pumps blood in humans is:', '["Lungs","Liver","Heart","Kidney"]', 2, 'The heart pumps blood throughout the body.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_liv_004', 'subj_bece_science', 'topic_bece_living', 'Animals that eat only plants are called:', '["Carnivores","Herbivores","Omnivores","Decomposers"]', 1, 'Herbivores eat only plants. Carnivores eat meat, omnivores eat both.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_liv_005', 'subj_bece_science', 'topic_bece_living', 'The process by which organisms produce offspring is:', '["Respiration","Excretion","Reproduction","Nutrition"]', 2, 'Reproduction is the biological process of producing new individuals.', 'easy', 'multiple_choice', datetime('now'));

-- Matter and Energy (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_mat_001', 'subj_bece_science', 'topic_bece_matter', 'The three states of matter are:', '["Hot, cold, warm","Solid, liquid, gas","Small, medium, large","Light, heavy, medium"]', 1, 'Matter exists in three main states: solid, liquid, and gas.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_mat_002', 'subj_bece_science', 'topic_bece_matter', 'When water freezes, it becomes:', '["Steam","Ice","Vapor","Liquid"]', 1, 'Freezing changes water from liquid to solid (ice).', 'easy', 'multiple_choice', datetime('now')),
('q_bece_mat_003', 'subj_bece_science', 'topic_bece_matter', 'Energy from the sun is called:', '["Electrical energy","Solar energy","Chemical energy","Sound energy"]', 1, 'Solar energy is energy from the sun.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_mat_004', 'subj_bece_science', 'topic_bece_matter', 'A simple machine that is a rigid bar that rotates around a fixed point is:', '["Pulley","Wheel and axle","Lever","Inclined plane"]', 2, 'A lever is a bar that pivots on a fulcrum (fixed point).', 'medium', 'multiple_choice', datetime('now')),
('q_bece_mat_005', 'subj_bece_science', 'topic_bece_matter', 'Heat travels through solids by:', '["Convection","Radiation","Conduction","Evaporation"]', 2, 'Conduction is the transfer of heat through solids by direct contact.', 'medium', 'multiple_choice', datetime('now'));

-- Environment and Health (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_env_001', 'subj_bece_science', 'topic_bece_environment', 'Water pollution is caused by:', '["Clean water","Dumping waste into water bodies","Planting trees","Recycling"]', 1, 'Dumping waste contaminates water, causing pollution.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_env_002', 'subj_bece_science', 'topic_bece_environment', 'A balanced diet contains:', '["Only proteins","Only carbohydrates","All food groups in right proportions","Only vitamins"]', 2, 'A balanced diet includes all nutrients in proper amounts.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_env_003', 'subj_bece_science', 'topic_bece_environment', 'Malaria is transmitted by:', '["Houseflies","Female Anopheles mosquito","Cockroaches","Rats"]', 1, 'The female Anopheles mosquito transmits malaria parasites.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_env_004', 'subj_bece_science', 'topic_bece_environment', 'The 3Rs of waste management are:', '["Run, Rest, Relax","Reduce, Reuse, Recycle","Read, Write, Remember","Red, Blue, Green"]', 1, 'Reduce, Reuse, Recycle helps manage waste sustainably.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_env_005', 'subj_bece_science', 'topic_bece_environment', 'Good personal hygiene includes:', '["Skipping baths","Regular handwashing","Sharing toothbrushes","Wearing dirty clothes"]', 1, 'Regular handwashing is essential for good hygiene.', 'easy', 'multiple_choice', datetime('now'));

-- Science and Technology (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_tech_001', 'subj_bece_science', 'topic_bece_technology', 'The scientific method starts with:', '["Conclusion","Observation/Question","Experiment","Hypothesis"]', 1, 'Scientific inquiry begins with observation or a question about nature.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_tech_002', 'subj_bece_science', 'topic_bece_technology', 'A hypothesis is:', '["A proven fact","An educated guess to be tested","The final answer","A measurement"]', 1, 'A hypothesis is a testable prediction or explanation.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_tech_003', 'subj_bece_science', 'topic_bece_technology', 'In an experiment, the control:', '["Is changed","Stays the same for comparison","Is not needed","Is always the answer"]', 1, 'The control remains unchanged to serve as a comparison baseline.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_tech_004', 'subj_bece_science', 'topic_bece_technology', 'Technology is the application of science to:', '["Create art only","Solve problems and improve life","Study history","Write poetry"]', 1, 'Technology applies scientific knowledge to practical problems.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_tech_005', 'subj_bece_science', 'topic_bece_technology', 'A thermometer is used to measure:', '["Weight","Temperature","Length","Volume"]', 1, 'A thermometer measures temperature.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- BECE SOCIAL STUDIES - Additional Questions (4 topics × 5 = 20 questions)
-- =============================================

-- Ghana Studies (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_gha_001', 'subj_bece_social', 'topic_bece_ghana', 'The capital city of Ghana is:', '["Kumasi","Accra","Tamale","Cape Coast"]', 1, 'Accra is the capital and largest city of Ghana.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_gha_002', 'subj_bece_social', 'topic_bece_ghana', 'Ghana''s Independence Day is celebrated on:', '["March 6","July 1","December 25","January 1"]', 0, 'Ghana gained independence on March 6, 1957.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_gha_003', 'subj_bece_social', 'topic_bece_ghana', 'Ghana was formerly known as:', '["Nigeria","Gold Coast","Sierra Leone","Liberia"]', 1, 'Ghana was called the Gold Coast under British colonial rule.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_gha_004', 'subj_bece_social', 'topic_bece_ghana', 'The national flag of Ghana has:', '["Two colors","Three colors","Four colors","Five colors"]', 1, 'Ghana''s flag has red, gold, and green with a black star.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_gha_005', 'subj_bece_social', 'topic_bece_ghana', 'Lake Volta was created by the:', '["Weija Dam","Akosombo Dam","Kpong Dam","Bui Dam"]', 1, 'The Akosombo Dam created Lake Volta, one of the world''s largest artificial lakes.', 'medium', 'multiple_choice', datetime('now'));

-- Civics and Governance (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_civ_001', 'subj_bece_social', 'topic_bece_civics', 'The head of state in Ghana is the:', '["Prime Minister","Speaker of Parliament","President","Chief Justice"]', 2, 'Ghana is a presidential republic with the President as head of state.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_civ_002', 'subj_bece_social', 'topic_bece_civics', 'A citizen''s responsibility includes:', '["Breaking laws","Paying taxes","Avoiding elections","Littering"]', 1, 'Paying taxes is a civic responsibility of all citizens.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_civ_003', 'subj_bece_social', 'topic_bece_civics', 'The right to vote is called:', '["Suffrage","Immigration","Emigration","Naturalization"]', 0, 'Suffrage is the right to vote in political elections.', 'medium', 'multiple_choice', datetime('now')),
('q_bece_civ_004', 'subj_bece_social', 'topic_bece_civics', 'Laws in Ghana are made by:', '["The President alone","Parliament","The Police","Traditional rulers only"]', 1, 'Parliament is the legislative body that makes laws in Ghana.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_civ_005', 'subj_bece_social', 'topic_bece_civics', 'Democracy means rule by:', '["The military","The rich only","The people","One person"]', 2, 'Democracy is government by the people, either directly or through elected representatives.', 'easy', 'multiple_choice', datetime('now'));

-- Basic Economics (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_econ_001', 'subj_bece_social', 'topic_bece_economics', 'Money is used as a:', '["Decoration","Medium of exchange","Food item","Building material"]', 1, 'Money serves as a medium of exchange for buying and selling goods.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_econ_002', 'subj_bece_social', 'topic_bece_economics', 'Natural resources include:', '["Factories","Roads","Forests and minerals","Schools"]', 2, 'Natural resources are materials from nature like forests, minerals, water.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_econ_003', 'subj_bece_social', 'topic_bece_economics', 'A market is a place where:', '["People only meet friends","Goods and services are bought and sold","Children play","People sleep"]', 1, 'A market is where buyers and sellers exchange goods and services.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_econ_004', 'subj_bece_social', 'topic_bece_economics', 'Ghana''s currency is the:', '["Dollar","Naira","Cedi","Pound"]', 2, 'The Ghana Cedi (GHS) is Ghana''s official currency.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_econ_005', 'subj_bece_social', 'topic_bece_economics', 'Saving money means:', '["Spending all income","Keeping part of income for future use","Borrowing money","Giving money away"]', 1, 'Saving is setting aside money for future needs or emergencies.', 'easy', 'multiple_choice', datetime('now'));

-- Geography (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_bece_geog_001', 'subj_bece_social', 'topic_bece_geography', 'Ghana is located in:', '["East Africa","West Africa","North Africa","South Africa"]', 1, 'Ghana is located in West Africa on the Gulf of Guinea.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_geog_002', 'subj_bece_social', 'topic_bece_geography', 'A map legend explains:', '["The map title only","Symbols used on the map","The date only","The author only"]', 1, 'A legend (key) explains the symbols and colors used on a map.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_geog_003', 'subj_bece_social', 'topic_bece_geography', 'The main compass directions are:', '["Up, Down, Left, Right","North, South, East, West","Front, Back, Side, Top","Inside, Outside, Above, Below"]', 1, 'The four cardinal directions are North, South, East, and West.', 'easy', 'multiple_choice', datetime('now')),
('q_bece_geog_004', 'subj_bece_social', 'topic_bece_geography', 'Ghana shares a border with:', '["Nigeria","Togo","Kenya","Egypt"]', 1, 'Ghana borders Togo (east), Côte d''Ivoire (west), and Burkina Faso (north).', 'medium', 'multiple_choice', datetime('now')),
('q_bece_geog_005', 'subj_bece_social', 'topic_bece_geography', 'The two main seasons in Ghana are:', '["Spring and Autumn","Rainy and Dry (Harmattan)","Summer and Winter","Hot and Cold"]', 1, 'Ghana has wet (rainy) and dry (harmattan) seasons.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- HISTORY - Additional Questions (10 topics)
-- =============================================

-- Pre-Colonial West Africa (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_hist_pre_002', 'subj_wassce_history', 'topic_hist_wa_precolonial', 'The Songhai Empire was centered around:', '["Timbuktu","Kumasi","Cairo","Lagos"]', 0, 'The Songhai Empire was centered around Gao and Timbuktu in present-day Mali.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_pre_003', 'subj_wassce_history', 'topic_hist_wa_precolonial', 'The Ashanti Empire was famous for its:', '["Pyramids","Golden Stool","Writing system","Naval fleet"]', 1, 'The Golden Stool is the sacred symbol of the Ashanti nation and its unity.', 'easy', 'multiple_choice', datetime('now')),
('q_hist_pre_004', 'subj_wassce_history', 'topic_hist_wa_precolonial', 'Trans-Saharan trade involved the exchange of:', '["Gold and salt","Spices and silk","Oil and rubber","Coffee and tea"]', 0, 'The main commodities in trans-Saharan trade were gold from the south and salt from the north.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_pre_005', 'subj_wassce_history', 'topic_hist_wa_precolonial', 'The Oyo Empire was located in present-day:', '["Ghana","Nigeria","Senegal","Mali"]', 1, 'The Oyo Empire was a Yoruba empire in what is now western Nigeria.', 'medium', 'multiple_choice', datetime('now'));

-- Colonial Period (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_hist_col_002', 'subj_wassce_history', 'topic_hist_wa_colonial', 'Indirect rule was a British colonial policy that:', '["Eliminated traditional rulers","Used traditional rulers to govern","Established democracy","Created new kingdoms"]', 1, 'Indirect rule used existing traditional rulers to administer colonies on behalf of the British.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_col_003', 'subj_wassce_history', 'topic_hist_wa_colonial', 'The scramble for Africa took place mainly in the:', '["18th century","Late 19th century","Early 20th century","17th century"]', 1, 'The scramble for Africa occurred primarily between 1881-1914.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_col_004', 'subj_wassce_history', 'topic_hist_wa_colonial', 'Assimilation was a colonial policy used by:', '["Britain","France","Germany","Portugal"]', 1, 'France used assimilation, attempting to make Africans culturally French.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_col_005', 'subj_wassce_history', 'topic_hist_wa_colonial', 'The main reason for colonization was:', '["Spreading education","Economic exploitation of resources","Tourism","Scientific research"]', 1, 'The primary motive for colonization was economic - exploiting African resources and labor.', 'easy', 'multiple_choice', datetime('now'));

-- African Nationalism (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_hist_nat_002', 'subj_wassce_history', 'topic_hist_nationalism', 'The first African country south of the Sahara to gain independence was:', '["Nigeria","Ghana","Kenya","South Africa"]', 1, 'Ghana (formerly Gold Coast) gained independence on March 6, 1957.', 'easy', 'multiple_choice', datetime('now')),
('q_hist_nat_003', 'subj_wassce_history', 'topic_hist_nationalism', 'Pan-Africanism aimed to:', '["Divide Africa","Unite people of African descent","Promote colonialism","End all trade"]', 1, 'Pan-Africanism sought solidarity among all people of African descent worldwide.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_nat_004', 'subj_wassce_history', 'topic_hist_nationalism', 'UGCC stands for:', '["United Gold Coast Convention","Union of Ghana Country Council","United Government of Coast Countries","Unity of Gold Coast Citizens"]', 0, 'The United Gold Coast Convention was founded in 1947 to push for self-governance.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_nat_005', 'subj_wassce_history', 'topic_hist_nationalism', 'The CPP was founded by:', '["J.B. Danquah","Kwame Nkrumah","Kofi Busia","Obetsebi Lamptey"]', 1, 'Kwame Nkrumah founded the Convention People''s Party (CPP) in 1949.', 'easy', 'multiple_choice', datetime('now'));

-- History of Ghana (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_hist_gha_002', 'subj_wassce_history', 'topic_hist_ghana', 'The Big Six of Gold Coast nationalism included:', '["Only Nkrumah","Six prominent nationalists including Nkrumah and Danquah","Six British governors","Six traditional chiefs"]', 1, 'The Big Six were six leaders arrested after the 1948 riots, including Nkrumah and Danquah.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_gha_003', 'subj_wassce_history', 'topic_hist_ghana', 'Ghana became a republic in:', '["1957","1960","1966","1969"]', 1, 'Ghana became a republic on July 1, 1960, with Nkrumah as its first president.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_gha_004', 'subj_wassce_history', 'topic_hist_ghana', 'The 1966 coup overthrew:', '["J.A. Kufuor","Kwame Nkrumah","Jerry Rawlings","Hilla Limann"]', 1, 'The February 24, 1966 coup overthrew President Kwame Nkrumah.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_gha_005', 'subj_wassce_history', 'topic_hist_ghana', 'Ghana''s Fourth Republic began in:', '["1979","1992","1993","2000"]', 2, 'The Fourth Republic began on January 7, 1993, after the 1992 constitution.', 'medium', 'multiple_choice', datetime('now'));

-- ECOWAS and Regional Integration (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_hist_ecow_002', 'subj_wassce_history', 'topic_hist_ecowas', 'ECOWAS was founded in:', '["Lagos, Nigeria","Accra, Ghana","Abuja, Nigeria","Dakar, Senegal"]', 0, 'ECOWAS was founded in Lagos, Nigeria in 1975.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_ecow_003', 'subj_wassce_history', 'topic_hist_ecowas', 'The main aim of ECOWAS is:', '["Military conquest","Economic integration","Cultural assimilation","Religious unity"]', 1, 'ECOWAS aims to promote economic integration and cooperation among West African states.', 'easy', 'multiple_choice', datetime('now')),
('q_hist_ecow_004', 'subj_wassce_history', 'topic_hist_ecowas', 'ECOMOG was ECOWAS''s:', '["Trade agreement","Military peacekeeping force","Educational program","Health initiative"]', 1, 'ECOMOG was the ECOWAS Monitoring Group, a peacekeeping force.', 'medium', 'multiple_choice', datetime('now')),
('q_hist_ecow_005', 'subj_wassce_history', 'topic_hist_ecowas', 'A challenge facing ECOWAS is:', '["Too few members","Political instability in member states","Excessive funding","Lack of languages"]', 1, 'Political instability and coups in member states challenge ECOWAS integration.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- FOODS AND NUTRITION - Additional Questions
-- =============================================

-- Nutrients (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fn_nut_002', 'subj_wassce_foods', 'topic_fn_nutrients', 'Which vitamin prevents night blindness?', '["Vitamin B","Vitamin C","Vitamin A","Vitamin D"]', 2, 'Vitamin A is essential for vision and prevents night blindness.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_nut_003', 'subj_wassce_foods', 'topic_fn_nutrients', 'Proteins are needed for:', '["Energy only","Body building and repair","Preventing diseases only","Digestion only"]', 1, 'Proteins are essential for growth, tissue repair, and body building.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_nut_004', 'subj_wassce_foods', 'topic_fn_nutrients', 'Iron deficiency causes:', '["Obesity","Anaemia","Goiter","Rickets"]', 1, 'Iron deficiency leads to anaemia, characterized by fatigue and weakness.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_nut_005', 'subj_wassce_foods', 'topic_fn_nutrients', 'Carbohydrates provide the body with:', '["Vitamins","Minerals","Energy","Hormones"]', 2, 'Carbohydrates are the main source of energy for the body.', 'easy', 'multiple_choice', datetime('now'));

-- Digestion and Absorption (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fn_dig_001', 'subj_wassce_foods', 'topic_fn_digestion', 'Digestion begins in the:', '["Stomach","Small intestine","Mouth","Large intestine"]', 2, 'Mechanical and chemical digestion begins in the mouth with chewing and saliva.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_dig_002', 'subj_wassce_foods', 'topic_fn_digestion', 'The enzyme in saliva that digests starch is:', '["Pepsin","Amylase","Lipase","Trypsin"]', 1, 'Salivary amylase (ptyalin) breaks down starch into maltose.', 'medium', 'multiple_choice', datetime('now')),
('q_fn_dig_003', 'subj_wassce_foods', 'topic_fn_digestion', 'Most nutrient absorption occurs in the:', '["Stomach","Small intestine","Large intestine","Mouth"]', 1, 'The small intestine is the primary site for nutrient absorption.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_dig_004', 'subj_wassce_foods', 'topic_fn_digestion', 'Bile is produced by the:', '["Pancreas","Stomach","Liver","Small intestine"]', 2, 'Bile is produced by the liver and stored in the gallbladder.', 'medium', 'multiple_choice', datetime('now')),
('q_fn_dig_005', 'subj_wassce_foods', 'topic_fn_digestion', 'The function of villi in the small intestine is to:', '["Produce enzymes","Increase surface area for absorption","Store food","Mix food"]', 1, 'Villi increase the surface area of the small intestine for efficient nutrient absorption.', 'medium', 'multiple_choice', datetime('now'));

-- Meal Planning (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fn_meal_001', 'subj_wassce_foods', 'topic_fn_meal_planning', 'A balanced meal should contain:', '["Only one food group","All food groups in correct proportions","Carbohydrates only","Proteins only"]', 1, 'A balanced meal includes foods from all major food groups in appropriate amounts.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_meal_002', 'subj_wassce_foods', 'topic_fn_meal_planning', 'When planning meals, one should consider:', '["Color only","Nutritional needs, budget, and preferences","Cost only","Speed of preparation only"]', 1, 'Meal planning considers nutrition, budget, preferences, availability, and cooking methods.', 'medium', 'multiple_choice', datetime('now')),
('q_fn_meal_003', 'subj_wassce_foods', 'topic_fn_meal_planning', 'A food guide pyramid shows:', '["Only fruits and vegetables","Recommended proportions of food groups","Only meats","Only grains"]', 1, 'The food pyramid/plate shows recommended proportions of different food groups.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_meal_004', 'subj_wassce_foods', 'topic_fn_meal_planning', 'Adolescents need more:', '["Sugar","Calcium and iron","Salt","Artificial additives"]', 1, 'Growing adolescents have increased needs for calcium (bones) and iron (blood).', 'medium', 'multiple_choice', datetime('now')),
('q_fn_meal_005', 'subj_wassce_foods', 'topic_fn_meal_planning', 'Menu variety helps ensure:', '["Lower cost","Adequate nutrient intake","Faster cooking","Smaller portions"]', 1, 'Variety in meals helps ensure all essential nutrients are obtained.', 'easy', 'multiple_choice', datetime('now'));

-- Food Safety and Hygiene (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_fn_safe_001', 'subj_wassce_foods', 'topic_fn_food_safety', 'Cross-contamination can be prevented by:', '["Using same cutting board for all foods","Separating raw and cooked foods","Never washing hands","Reusing dirty utensils"]', 1, 'Separating raw and cooked foods prevents transfer of bacteria.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_safe_002', 'subj_wassce_foods', 'topic_fn_food_safety', 'Refrigeration slows bacterial growth because:', '["Bacteria prefer cold","Cold temperatures slow bacterial activity","Cold kills all bacteria","Bacteria cannot see in the dark"]', 1, 'Low temperatures slow down bacterial reproduction and activity.', 'medium', 'multiple_choice', datetime('now')),
('q_fn_safe_003', 'subj_wassce_foods', 'topic_fn_food_safety', 'Food poisoning symptoms include:', '["Improved energy","Vomiting, diarrhea, stomach pain","Better appetite","Weight gain"]', 1, 'Food poisoning typically causes vomiting, diarrhea, abdominal pain, and fever.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_safe_004', 'subj_wassce_foods', 'topic_fn_food_safety', 'Safe food handling includes:', '["Tasting raw meat","Washing hands before handling food","Using dirty cloths","Leaving food at room temperature for days"]', 1, 'Proper handwashing is essential for safe food handling.', 'easy', 'multiple_choice', datetime('now')),
('q_fn_safe_005', 'subj_wassce_foods', 'topic_fn_food_safety', 'Canning preserves food by:', '["Freezing it","Heat processing and sealing in airtight containers","Adding sugar only","Drying it"]', 1, 'Canning uses heat to kill microorganisms and airtight sealing to prevent recontamination.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- ICT - Additional Questions
-- =============================================

-- Computer Fundamentals (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ict_fund_002', 'subj_wassce_ict', 'topic_ict_fundamentals', 'RAM stands for:', '["Read Access Memory","Random Access Memory","Run Access Memory","Rapid Access Memory"]', 1, 'RAM is Random Access Memory, the computer''s main working memory.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_fund_003', 'subj_wassce_ict', 'topic_ict_fundamentals', 'A byte consists of:', '["4 bits","8 bits","16 bits","32 bits"]', 1, 'A byte equals 8 bits, the basic unit of digital information.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_fund_004', 'subj_wassce_ict', 'topic_ict_fundamentals', 'The first generation of computers used:', '["Transistors","Vacuum tubes","Integrated circuits","Microprocessors"]', 1, 'First generation computers (1940s-1950s) used vacuum tubes.', 'medium', 'multiple_choice', datetime('now')),
('q_ict_fund_005', 'subj_wassce_ict', 'topic_ict_fundamentals', 'A supercomputer is used for:', '["Simple word processing","Complex scientific calculations","Basic web browsing","Playing simple games"]', 1, 'Supercomputers handle extremely complex calculations for research, weather modeling, etc.', 'easy', 'multiple_choice', datetime('now'));

-- Software Concepts (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ict_soft_002', 'subj_wassce_ict', 'topic_ict_software', 'Examples of application software include:', '["Windows and Linux","Word processors and spreadsheets","BIOS and firmware","Device drivers"]', 1, 'Application software includes programs users work with directly like Word, Excel, etc.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_soft_003', 'subj_wassce_ict', 'topic_ict_software', 'Open source software:', '["Costs money","Has source code freely available","Cannot be modified","Is always inferior"]', 1, 'Open source software has publicly available source code that can be modified freely.', 'medium', 'multiple_choice', datetime('now')),
('q_ict_soft_004', 'subj_wassce_ict', 'topic_ict_software', 'A virus is a type of:', '["Hardware","Malware","Operating system","Application"]', 1, 'A computer virus is malicious software (malware) that replicates and causes harm.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_soft_005', 'subj_wassce_ict', 'topic_ict_software', 'Antivirus software is used to:', '["Speed up the computer","Detect and remove malware","Create documents","Browse the internet"]', 1, 'Antivirus software protects computers by detecting and removing malicious programs.', 'easy', 'multiple_choice', datetime('now'));

-- Computer Hardware (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ict_hard_002', 'subj_wassce_ict', 'topic_ict_hardware', 'A printer is a(n):', '["Input device","Output device","Storage device","Processing device"]', 1, 'A printer is an output device that produces hard copy of digital documents.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_hard_003', 'subj_wassce_ict', 'topic_ict_hardware', 'The hard disk is used for:', '["Processing data","Permanent storage","Displaying output","Input only"]', 1, 'The hard disk provides permanent (non-volatile) storage for data and programs.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_hard_004', 'subj_wassce_ict', 'topic_ict_hardware', 'USB stands for:', '["Universal System Bus","Universal Serial Bus","United System Board","Unified Serial Board"]', 1, 'USB is Universal Serial Bus, a standard for connecting devices.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_hard_005', 'subj_wassce_ict', 'topic_ict_hardware', 'The motherboard:', '["Is an output device","Connects all computer components","Stores data permanently","Prints documents"]', 1, 'The motherboard is the main circuit board connecting all computer components.', 'medium', 'multiple_choice', datetime('now'));

-- Networking (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ict_net_002', 'subj_wassce_ict', 'topic_ict_networking', 'WAN stands for:', '["Wide Area Network","Wireless Access Node","Web Access Network","World Area Network"]', 0, 'WAN is Wide Area Network, covering large geographical areas.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_net_003', 'subj_wassce_ict', 'topic_ict_networking', 'A router:', '["Only prints documents","Connects different networks and directs data","Only stores files","Only creates websites"]', 1, 'A router connects networks and forwards data packets between them.', 'medium', 'multiple_choice', datetime('now')),
('q_ict_net_004', 'subj_wassce_ict', 'topic_ict_networking', 'An IP address:', '["Identifies a computer on a network","Is a type of software","Only works offline","Is a password"]', 0, 'An IP address uniquely identifies a device on a network.', 'medium', 'multiple_choice', datetime('now')),
('q_ict_net_005', 'subj_wassce_ict', 'topic_ict_networking', 'WiFi is a type of:', '["Wired connection","Wireless network technology","Storage device","Software"]', 1, 'WiFi enables wireless local area networking based on IEEE 802.11 standards.', 'easy', 'multiple_choice', datetime('now'));

-- Internet and Web (4 more needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_ict_int_002', 'subj_wassce_ict', 'topic_ict_internet', 'A web browser is used to:', '["Create documents","View websites on the internet","Store files","Print photos"]', 1, 'Web browsers like Chrome, Firefox, Safari are used to access and view websites.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_int_003', 'subj_wassce_ict', 'topic_ict_internet', 'A search engine is:', '["A car engine","A tool to find information on the web","A type of printer","A storage device"]', 1, 'Search engines like Google help users find information on the internet.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_int_004', 'subj_wassce_ict', 'topic_ict_internet', 'Email stands for:', '["Electronic mail","Express mail","External mail","Emergency mail"]', 0, 'Email is electronic mail, a method of exchanging digital messages.', 'easy', 'multiple_choice', datetime('now')),
('q_ict_int_005', 'subj_wassce_ict', 'topic_ict_internet', 'Cybersecurity involves:', '["Playing games","Protecting computers and data from threats","Building computers","Installing printers"]', 1, 'Cybersecurity protects computer systems and data from cyber threats.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- WASSCE ACCOUNTING - Additional Questions
-- Topics from migration 064
-- =============================================

-- Accounting Introduction (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_acc_intro_001', 'subj_wassce_accounting', 'topic_acc_intro', 'Accounting is often called:', '["The language of business","The art of selling","The science of production","The study of markets"]', 0, 'Accounting communicates financial information, hence called the language of business.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_intro_002', 'subj_wassce_accounting', 'topic_acc_intro', 'The accounting equation is:', '["Assets = Liabilities - Capital","Assets = Liabilities + Capital","Assets + Liabilities = Capital","Capital = Assets + Liabilities"]', 1, 'The fundamental accounting equation: Assets = Liabilities + Capital (Owner''s Equity).', 'easy', 'multiple_choice', datetime('now')),
('q_acc_intro_003', 'subj_wassce_accounting', 'topic_acc_intro', 'Double-entry bookkeeping means:', '["Recording transactions twice","Every transaction has two equal entries","Using two accountants","Recording in two books"]', 1, 'Double-entry records a debit and credit for every transaction.', 'medium', 'multiple_choice', datetime('now')),
('q_acc_intro_004', 'subj_wassce_accounting', 'topic_acc_intro', 'A ledger is:', '["A book of original entry","A book of final entry","A bank statement","An invoice"]', 1, 'The ledger is the book of final entry where accounts are maintained.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_intro_005', 'subj_wassce_accounting', 'topic_acc_intro', 'The accounting period is usually:', '["One week","One month","One year","Ten years"]', 2, 'The standard accounting period is typically one year (financial year).', 'easy', 'multiple_choice', datetime('now'));

-- Journal Entries (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_acc_jour_001', 'subj_wassce_accounting', 'topic_acc_journal', 'The journal is also known as:', '["Day book or book of original entry","Ledger","Cash book","Trial balance"]', 0, 'The journal is the book of original entry where transactions are first recorded.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_jour_002', 'subj_wassce_accounting', 'topic_acc_journal', 'When cash is received, Cash Account is:', '["Credited","Debited","Neither","Both"]', 1, 'Cash received increases the asset, so Cash Account is debited.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_jour_003', 'subj_wassce_accounting', 'topic_acc_journal', 'The purchases journal records:', '["All purchases","Credit purchases only","Cash purchases only","Sales only"]', 1, 'The purchases journal records credit purchases; cash purchases go in the cash book.', 'medium', 'multiple_choice', datetime('now')),
('q_acc_jour_004', 'subj_wassce_accounting', 'topic_acc_journal', 'A narration in a journal entry:', '["Is not necessary","Explains the transaction","Lists prices only","Shows totals"]', 1, 'The narration provides a brief explanation of the journal entry.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_jour_005', 'subj_wassce_accounting', 'topic_acc_journal', 'Goods returned by a customer are recorded in:', '["Sales journal","Purchases journal","Sales returns journal","General journal"]', 2, 'Returns from customers are recorded in the Sales Returns (Returns Inward) Journal.', 'medium', 'multiple_choice', datetime('now'));

-- Depreciation (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_acc_dep_001', 'subj_wassce_accounting', 'topic_acc_depreciation', 'Depreciation is:', '["An increase in asset value","A decrease in asset value over time","Interest on loans","A type of income"]', 1, 'Depreciation represents the reduction in value of fixed assets over time.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_dep_002', 'subj_wassce_accounting', 'topic_acc_depreciation', 'Straight-line depreciation charges:', '["Different amounts each year","Equal amounts each year","More in early years","Less in early years"]', 1, 'Straight-line method charges equal depreciation amounts each year.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_dep_003', 'subj_wassce_accounting', 'topic_acc_depreciation', 'Reducing balance method results in:', '["Higher depreciation in early years","Lower depreciation in early years","Equal depreciation","No depreciation"]', 0, 'Reducing balance charges higher depreciation in the early years of asset life.', 'medium', 'multiple_choice', datetime('now')),
('q_acc_dep_004', 'subj_wassce_accounting', 'topic_acc_depreciation', 'Book value equals:', '["Cost - Accumulated depreciation","Cost + Depreciation","Cost × Rate","Sale price"]', 0, 'Book value (Net Book Value) = Cost - Accumulated Depreciation.', 'medium', 'multiple_choice', datetime('now')),
('q_acc_dep_005', 'subj_wassce_accounting', 'topic_acc_depreciation', 'Land is usually:', '["Depreciated","Not depreciated","Appreciated only","Expensed immediately"]', 1, 'Land typically has unlimited useful life and is not depreciated.', 'easy', 'multiple_choice', datetime('now'));

-- Trial Balance (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_acc_tb_001', 'subj_wassce_accounting', 'topic_acc_trial', 'A trial balance proves:', '["Profit made","Arithmetical accuracy of ledger","Value of assets","Amount of sales"]', 1, 'A trial balance verifies that debits equal credits in the ledger.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_tb_002', 'subj_wassce_accounting', 'topic_acc_trial', 'If trial balance totals don''t agree, there may be:', '["An error","Profit","Loss","Success"]', 0, 'Unequal totals indicate errors in recording or posting.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_tb_003', 'subj_wassce_accounting', 'topic_acc_trial', 'Assets appear on which side of trial balance?', '["Credit side","Debit side","Both sides","Neither side"]', 1, 'Assets have debit balances and appear on the debit side.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_tb_004', 'subj_wassce_accounting', 'topic_acc_trial', 'A trial balance does NOT reveal:', '["Errors of omission","Debit totals","Credit totals","Account balances"]', 0, 'A trial balance cannot detect errors of omission (transactions not recorded at all).', 'medium', 'multiple_choice', datetime('now')),
('q_acc_tb_005', 'subj_wassce_accounting', 'topic_acc_trial', 'Capital appears on the:', '["Debit side","Credit side","Neither","Both"]', 1, 'Capital is a liability to the business and has a credit balance.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- WASSCE ECONOMICS - Additional Questions
-- =============================================

-- Basic Economic Concepts (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_econ_basic_001', 'subj_wassce_economics', 'topic_econ_basic', 'Scarcity in economics means:', '["There is nothing available","Resources are limited relative to wants","Prices are too high","No one wants goods"]', 1, 'Scarcity refers to the limited availability of resources relative to unlimited human wants.', 'easy', 'multiple_choice', datetime('now')),
('q_econ_basic_002', 'subj_wassce_economics', 'topic_econ_basic', 'Opportunity cost is:', '["The price paid for goods","The next best alternative forgone","Total production cost","Money spent on advertising"]', 1, 'Opportunity cost is the value of the best alternative given up when a choice is made.', 'medium', 'multiple_choice', datetime('now')),
('q_econ_basic_003', 'subj_wassce_economics', 'topic_econ_basic', 'The factors of production are:', '["Money, machines, materials","Land, labour, capital, enterprise","Imports and exports","Supply and demand"]', 1, 'The four factors of production are land, labour, capital, and entrepreneurship.', 'easy', 'multiple_choice', datetime('now')),
('q_econ_basic_004', 'subj_wassce_economics', 'topic_econ_basic', 'A mixed economy combines:', '["Only capitalism","Only socialism","Elements of both market and planned economy","Only traditional systems"]', 2, 'A mixed economy has characteristics of both market (capitalism) and planned (socialism) systems.', 'medium', 'multiple_choice', datetime('now')),
('q_econ_basic_005', 'subj_wassce_economics', 'topic_econ_basic', 'The basic economic problem is:', '["How to advertise products","What, how, and for whom to produce","How to print money","How to eliminate poverty"]', 1, 'The basic economic questions are: What to produce? How to produce? For whom to produce?', 'easy', 'multiple_choice', datetime('now'));

-- Demand and Supply (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_econ_ds_001', 'subj_wassce_economics', 'topic_econ_demand', 'The law of demand states that:', '["As price rises, quantity demanded rises","As price falls, quantity demanded rises","Price and demand are unrelated","Demand is always constant"]', 1, 'Law of demand: price and quantity demanded are inversely related (ceteris paribus).', 'easy', 'multiple_choice', datetime('now')),
('q_econ_ds_002', 'subj_wassce_economics', 'topic_econ_demand', 'A shift in the demand curve is caused by:', '["Change in price of the good","Change in consumer income","Change in quantity demanded","Movement along the curve"]', 1, 'Non-price factors like income, preferences, or prices of related goods shift the curve.', 'medium', 'multiple_choice', datetime('now')),
('q_econ_ds_003', 'subj_wassce_economics', 'topic_econ_demand', 'Equilibrium price occurs when:', '["Demand exceeds supply","Supply exceeds demand","Quantity demanded equals quantity supplied","Government sets the price"]', 2, 'Equilibrium is where the demand and supply curves intersect.', 'medium', 'multiple_choice', datetime('now')),
('q_econ_ds_004', 'subj_wassce_economics', 'topic_econ_demand', 'If supply increases while demand remains constant:', '["Price rises","Price falls","Price stays the same","Quantity decreases"]', 1, 'Increased supply with constant demand leads to lower equilibrium price.', 'medium', 'multiple_choice', datetime('now')),
('q_econ_ds_005', 'subj_wassce_economics', 'topic_econ_demand', 'Price elasticity of demand measures:', '["Total spending","Responsiveness of demand to price changes","Supply changes","Production costs"]', 1, 'Price elasticity measures how sensitive quantity demanded is to price changes.', 'medium', 'multiple_choice', datetime('now'));

-- Money and Banking (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_econ_money_001', 'subj_wassce_economics', 'topic_econ_money', 'Functions of money include:', '["Only store of value","Medium of exchange, unit of account, store of value","Only measure of debt","Only means of payment"]', 1, 'Money serves as medium of exchange, unit of account, store of value, and standard of deferred payment.', 'easy', 'multiple_choice', datetime('now')),
('q_econ_money_002', 'subj_wassce_economics', 'topic_econ_money', 'The Central Bank of Ghana:', '["Issues currency","Gives loans to individuals","Sells consumer goods","Operates retail stores"]', 0, 'The Central Bank (Bank of Ghana) is responsible for issuing currency and monetary policy.', 'easy', 'multiple_choice', datetime('now')),
('q_econ_money_003', 'subj_wassce_economics', 'topic_econ_money', 'Commercial banks create money through:', '["Printing currency","Lending and the multiplier effect","Importing gold","Selling bonds only"]', 1, 'Banks create money through the lending process and credit multiplier.', 'medium', 'multiple_choice', datetime('now')),
('q_econ_money_004', 'subj_wassce_economics', 'topic_econ_money', 'Inflation refers to:', '["Falling prices","Rising general price level","Stable prices","Increasing production"]', 1, 'Inflation is a sustained increase in the general price level over time.', 'easy', 'multiple_choice', datetime('now')),
('q_econ_money_005', 'subj_wassce_economics', 'topic_econ_money', 'Interest rate is the:', '["Price of goods","Cost of borrowing money","Tax on income","Profit margin"]', 1, 'Interest rate is the cost of borrowing money or the return on lending.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- WASSCE GOVERNMENT - Additional Questions
-- =============================================

-- Constitution and Rule of Law (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_gov_const_001', 'subj_wassce_government', 'topic_gov_constitution', 'A constitution is:', '["A law passed by parliament","The supreme law of a country","A political party document","A court ruling"]', 1, 'A constitution is the fundamental law that establishes the framework of government.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_const_002', 'subj_wassce_government', 'topic_gov_constitution', 'Rule of law means:', '["The king makes all laws","No one is above the law","Only courts make laws","Parliament is supreme"]', 1, 'Rule of law means everyone, including government, is subject to the law.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_const_003', 'subj_wassce_government', 'topic_gov_constitution', 'Ghana''s 1992 Constitution established:', '["A monarchy","A military government","A multi-party democracy","A one-party state"]', 2, 'The 1992 Constitution established the Fourth Republic as a multi-party democracy.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_const_004', 'subj_wassce_government', 'topic_gov_constitution', 'Separation of powers divides government into:', '["Two branches","Three branches","Four branches","Five branches"]', 1, 'Power is divided among Executive, Legislative, and Judicial branches.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_const_005', 'subj_wassce_government', 'topic_gov_constitution', 'Fundamental human rights are:', '["Granted by government","Inherent to all humans","Only for citizens","Earned through work"]', 1, 'Human rights are inherent and belong to everyone by virtue of being human.', 'medium', 'multiple_choice', datetime('now'));

-- Arms of Government (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_gov_arms_001', 'subj_wassce_government', 'topic_gov_arms', 'The Executive branch is responsible for:', '["Making laws","Implementing laws","Interpreting laws","Amending the constitution"]', 1, 'The Executive implements and enforces laws made by the Legislature.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_arms_002', 'subj_wassce_government', 'topic_gov_arms', 'The Legislature''s main function is:', '["Law-making","Law enforcement","Law interpretation","Military operations"]', 0, 'The Legislature (Parliament) is responsible for making laws.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_arms_003', 'subj_wassce_government', 'topic_gov_arms', 'The Judiciary:', '["Makes laws","Interprets laws and settles disputes","Collects taxes","Commands the army"]', 1, 'The Judiciary interprets laws and adjudicates legal disputes.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_arms_004', 'subj_wassce_government', 'topic_gov_arms', 'Checks and balances ensure:', '["One branch dominates","No branch becomes too powerful","All branches cooperate always","No conflicts arise"]', 1, 'Checks and balances prevent any single branch from gaining too much power.', 'medium', 'multiple_choice', datetime('now')),
('q_gov_arms_005', 'subj_wassce_government', 'topic_gov_arms', 'In Ghana, the head of the Executive is:', '["The Speaker","The Chief Justice","The President","The Prime Minister"]', 2, 'The President heads the Executive branch in Ghana''s presidential system.', 'easy', 'multiple_choice', datetime('now'));

-- Local Government (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_gov_local_001', 'subj_wassce_government', 'topic_gov_local', 'Local government brings governance:', '["To the national capital only","Closer to the people","Further from citizens","Only to cities"]', 1, 'Local government decentralizes power, bringing governance closer to communities.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_local_002', 'subj_wassce_government', 'topic_gov_local', 'The head of a Metropolitan Assembly is:', '["A mayor","A chief","A minister","A senator"]', 0, 'Metropolitan Assemblies are headed by elected mayors.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_local_003', 'subj_wassce_government', 'topic_gov_local', 'Functions of local government include:', '["Printing currency","Providing local services and infrastructure","Conducting foreign policy","Commanding the military"]', 1, 'Local governments provide roads, sanitation, markets, and other community services.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_local_004', 'subj_wassce_government', 'topic_gov_local', 'District Assembly Common Fund comes from:', '["Foreign loans only","Central government revenue","Local taxes only","Private donations only"]', 1, 'The DACF is a share of national revenue allocated to District Assemblies.', 'medium', 'multiple_choice', datetime('now')),
('q_gov_local_005', 'subj_wassce_government', 'topic_gov_local', 'Decentralization means:', '["Concentrating power at the center","Transferring power to local levels","Abolishing local government","Creating new ministries"]', 1, 'Decentralization transfers authority from central to local government.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- WASSCE GEOGRAPHY - Additional Questions
-- =============================================

-- Physical Geography (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_geog_phys_001', 'subj_wassce_geography', 'topic_geog_physical', 'The earth''s crust is called the:', '["Mantle","Core","Lithosphere","Atmosphere"]', 2, 'The lithosphere comprises the earth''s crust and upper mantle.', 'medium', 'multiple_choice', datetime('now')),
('q_geog_phys_002', 'subj_wassce_geography', 'topic_geog_physical', 'Weathering is the:', '["Movement of rocks","Breakdown of rocks in situ","Formation of mountains","Building of soil"]', 1, 'Weathering is the in-place breakdown of rocks by physical, chemical, or biological processes.', 'easy', 'multiple_choice', datetime('now')),
('q_geog_phys_003', 'subj_wassce_geography', 'topic_geog_physical', 'A delta is formed at:', '["Mountain tops","River mouths","Ocean depths","Lake centers"]', 1, 'Deltas form where rivers deposit sediment at their mouths, often entering the sea.', 'easy', 'multiple_choice', datetime('now')),
('q_geog_phys_004', 'subj_wassce_geography', 'topic_geog_physical', 'The water cycle includes:', '["Evaporation, condensation, precipitation","Only rainfall","Only evaporation","Photosynthesis"]', 0, 'The hydrological cycle involves evaporation, condensation, precipitation, and collection.', 'easy', 'multiple_choice', datetime('now')),
('q_geog_phys_005', 'subj_wassce_geography', 'topic_geog_physical', 'An earthquake occurs due to:', '["Wind movement","Movement of tectonic plates","Heavy rainfall","Human activities only"]', 1, 'Earthquakes result from sudden movement or fracture of tectonic plates.', 'medium', 'multiple_choice', datetime('now'));

-- Climate and Weather (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_geog_clim_001', 'subj_wassce_geography', 'topic_geog_climate', 'Weather refers to:', '["Long-term atmospheric conditions","Day-to-day atmospheric conditions","Only temperature","Only rainfall"]', 1, 'Weather describes short-term atmospheric conditions at a specific time and place.', 'easy', 'multiple_choice', datetime('now')),
('q_geog_clim_002', 'subj_wassce_geography', 'topic_geog_climate', 'Climate is the:', '["Daily weather report","Average weather over many years","Temperature today","Rainfall this week"]', 1, 'Climate is the average weather pattern over a long period (typically 30+ years).', 'easy', 'multiple_choice', datetime('now')),
('q_geog_clim_003', 'subj_wassce_geography', 'topic_geog_climate', 'The equator experiences:', '["Cold winters","Hot temperatures year-round","Four distinct seasons","Snow"]', 1, 'Equatorial regions have consistently high temperatures with minimal seasonal variation.', 'easy', 'multiple_choice', datetime('now')),
('q_geog_clim_004', 'subj_wassce_geography', 'topic_geog_climate', 'The harmattan wind in West Africa is:', '["Warm and wet","Cold and dry","Hot and wet","Mild and variable"]', 1, 'The harmattan is a dry, dusty wind blowing from the Sahara during winter months.', 'easy', 'multiple_choice', datetime('now')),
('q_geog_clim_005', 'subj_wassce_geography', 'topic_geog_climate', 'A rain gauge measures:', '["Wind speed","Temperature","Rainfall amount","Humidity"]', 2, 'A rain gauge measures precipitation (rainfall) in millimeters or inches.', 'easy', 'multiple_choice', datetime('now'));

-- Map Reading (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_geog_map_001', 'subj_wassce_geography', 'topic_geog_mapwork', 'Scale on a map shows:', '["Direction","The ratio between map and actual distance","Height only","Population"]', 1, 'Scale indicates the relationship between distances on the map and real-world distances.', 'easy', 'multiple_choice', datetime('now')),
('q_geog_map_002', 'subj_wassce_geography', 'topic_geog_mapwork', 'Contour lines connect points of:', '["Equal population","Equal height above sea level","Equal temperature","Equal rainfall"]', 1, 'Contour lines join points of equal elevation/altitude.', 'medium', 'multiple_choice', datetime('now')),
('q_geog_map_003', 'subj_wassce_geography', 'topic_geog_mapwork', 'Grid references help to:', '["Measure temperature","Locate exact positions on a map","Show rainfall","Indicate wind direction"]', 1, 'Grid references use coordinates to pinpoint locations on maps.', 'medium', 'multiple_choice', datetime('now')),
('q_geog_map_004', 'subj_wassce_geography', 'topic_geog_mapwork', 'Closely spaced contour lines indicate:', '["Flat land","Steep slope","Water body","Forest"]', 1, 'Close contours show rapid change in elevation, indicating steep terrain.', 'medium', 'multiple_choice', datetime('now')),
('q_geog_map_005', 'subj_wassce_geography', 'topic_geog_mapwork', 'North is usually at the:', '["Bottom of the map","Top of the map","Left of the map","Right of the map"]', 1, 'By convention, north is typically at the top of maps.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- WASSCE LITERATURE - Additional Questions
-- =============================================

-- Literary Terms (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_lit_terms_001', 'subj_wassce_literature', 'topic_lit_terms', 'A metaphor is:', '["A direct comparison using like or as","An implied comparison without like or as","Exaggeration","Repetition of sounds"]', 1, 'A metaphor compares two unlike things directly without using "like" or "as."', 'medium', 'multiple_choice', datetime('now')),
('q_lit_terms_002', 'subj_wassce_literature', 'topic_lit_terms', 'A simile uses:', '["Hidden meanings","Like or as for comparison","Exaggeration","Contradictions"]', 1, 'A simile makes comparisons using "like" or "as."', 'easy', 'multiple_choice', datetime('now')),
('q_lit_terms_003', 'subj_wassce_literature', 'topic_lit_terms', 'Irony involves:', '["Exaggeration","Contrast between expectation and reality","Repetition","Direct statement"]', 1, 'Irony is a contrast between what is expected and what actually happens.', 'medium', 'multiple_choice', datetime('now')),
('q_lit_terms_004', 'subj_wassce_literature', 'topic_lit_terms', 'Personification gives human qualities to:', '["Humans only","Non-human things","Other characters","The narrator"]', 1, 'Personification attributes human characteristics to animals, objects, or ideas.', 'easy', 'multiple_choice', datetime('now')),
('q_lit_terms_005', 'subj_wassce_literature', 'topic_lit_terms', 'The theme of a literary work is:', '["The main character","The central idea or message","The setting","The plot summary"]', 1, 'Theme is the central idea or underlying meaning of a literary work.', 'easy', 'multiple_choice', datetime('now'));

-- Poetry Analysis (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_lit_poetry_001', 'subj_wassce_literature', 'topic_lit_poetry', 'Rhyme scheme refers to:', '["The pattern of rhyming words at line ends","The number of lines","The title","The poet''s name"]', 0, 'Rhyme scheme is the pattern of end rhymes in a poem, labeled with letters (e.g., ABAB).', 'easy', 'multiple_choice', datetime('now')),
('q_lit_poetry_002', 'subj_wassce_literature', 'topic_lit_poetry', 'Alliteration is:', '["Repetition of vowel sounds","Repetition of consonant sounds at the start of words","End rhyme","A type of stanza"]', 1, 'Alliteration is the repetition of initial consonant sounds in nearby words.', 'easy', 'multiple_choice', datetime('now')),
('q_lit_poetry_003', 'subj_wassce_literature', 'topic_lit_poetry', 'A stanza is:', '["A single line of poetry","A group of lines forming a unit","The title","The poet"]', 1, 'A stanza is a grouped set of lines in a poem, separated by spaces.', 'easy', 'multiple_choice', datetime('now')),
('q_lit_poetry_004', 'subj_wassce_literature', 'topic_lit_poetry', 'Imagery appeals to the:', '["Intellect only","Five senses","Logic only","Argument"]', 1, 'Imagery creates mental pictures by appealing to the senses (sight, sound, touch, taste, smell).', 'medium', 'multiple_choice', datetime('now')),
('q_lit_poetry_005', 'subj_wassce_literature', 'topic_lit_poetry', 'A sonnet typically has:', '["8 lines","12 lines","14 lines","16 lines"]', 2, 'A sonnet is a 14-line poem with a specific rhyme scheme and meter.', 'medium', 'multiple_choice', datetime('now'));

-- Drama Analysis (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_lit_drama_001', 'subj_wassce_literature', 'topic_lit_drama', 'A soliloquy is when a character:', '["Talks to another character","Speaks thoughts aloud while alone","Sings a song","Reads a letter"]', 1, 'A soliloquy is a speech where a character reveals thoughts aloud, alone on stage.', 'medium', 'multiple_choice', datetime('now')),
('q_lit_drama_002', 'subj_wassce_literature', 'topic_lit_drama', 'Tragedy typically ends with:', '["A happy ending","The hero''s downfall or death","A wedding","A comedy"]', 1, 'Tragedy ends with the protagonist''s downfall, often death, due to a fatal flaw.', 'easy', 'multiple_choice', datetime('now')),
('q_lit_drama_003', 'subj_wassce_literature', 'topic_lit_drama', 'Stage directions tell:', '["The dialogue","How actors should move and speak","The plot only","The theme"]', 1, 'Stage directions give instructions for performance, movement, and delivery.', 'easy', 'multiple_choice', datetime('now')),
('q_lit_drama_004', 'subj_wassce_literature', 'topic_lit_drama', 'An act in a play is:', '["A single speech","A major division of the play","A character type","A stage direction"]', 1, 'Acts are major divisions of a play, often containing multiple scenes.', 'easy', 'multiple_choice', datetime('now')),
('q_lit_drama_005', 'subj_wassce_literature', 'topic_lit_drama', 'The protagonist is:', '["The villain","The main character","A minor character","The narrator"]', 1, 'The protagonist is the central character around whom the story revolves.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- WASSCE CRS - Additional Questions
-- =============================================

-- Old Testament Studies (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_crs_ot_001', 'subj_wassce_crs', 'topic_crs_creation', 'According to Genesis, God created humans on:', '["Day 3","Day 5","Day 6","Day 7"]', 2, 'Genesis states that God created humans on the sixth day of creation.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_ot_002', 'subj_wassce_crs', 'topic_crs_creation', 'The fall of man occurred because:', '["Adam and Eve disobeyed God","They worked too hard","They were hungry","God was angry"]', 0, 'Adam and Eve ate from the forbidden tree, disobeying God''s command.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_ot_003', 'subj_wassce_crs', 'topic_crs_creation', 'The covenant with Noah included:', '["The rainbow as a sign","The cross","The star","The moon"]', 0, 'God gave the rainbow as a sign of His covenant never to flood the earth again.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_ot_004', 'subj_wassce_crs', 'topic_crs_creation', 'Abraham was called the father of:', '["All nations","Faith","Many nations","The Jews only"]', 2, 'God promised Abraham he would be the father of many nations.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_ot_005', 'subj_wassce_crs', 'topic_crs_creation', 'Moses received the Ten Commandments on Mount:', '["Carmel","Sinai","Zion","Nebo"]', 1, 'Moses received the Ten Commandments on Mount Sinai.', 'easy', 'multiple_choice', datetime('now'));

-- New Testament Studies (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_crs_nt_001', 'subj_wassce_crs', 'topic_crs_jesus', 'Jesus was born in:', '["Jerusalem","Nazareth","Bethlehem","Capernaum"]', 2, 'According to the Gospels, Jesus was born in Bethlehem.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_nt_002', 'subj_wassce_crs', 'topic_crs_jesus', 'The first miracle of Jesus was:', '["Feeding 5000","Raising Lazarus","Turning water to wine","Walking on water"]', 2, 'Jesus'' first miracle was turning water into wine at the wedding in Cana.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_nt_003', 'subj_wassce_crs', 'topic_crs_jesus', 'The Sermon on the Mount includes:', '["The Ten Commandments","The Beatitudes","The Lord''s Supper","The Exodus story"]', 1, 'The Beatitudes ("Blessed are...") are part of the Sermon on the Mount.', 'medium', 'multiple_choice', datetime('now')),
('q_crs_nt_004', 'subj_wassce_crs', 'topic_crs_jesus', 'Jesus had how many disciples?', '["10","12","14","7"]', 1, 'Jesus chose twelve disciples/apostles.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_nt_005', 'subj_wassce_crs', 'topic_crs_jesus', 'The resurrection of Jesus occurred:', '["On the same day as crucifixion","On the third day","After one week","After one month"]', 1, 'Jesus rose from the dead on the third day after crucifixion.', 'easy', 'multiple_choice', datetime('now'));

-- Christian Living (5 needed)
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_crs_life_001', 'subj_wassce_crs', 'topic_crs_living', 'The greatest commandment according to Jesus is:', '["Do not steal","Love God and love your neighbor","Keep the Sabbath","Honor your parents"]', 1, 'Jesus said the greatest commandments are to love God and love your neighbor.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_life_002', 'subj_wassce_crs', 'topic_crs_living', 'The fruits of the Spirit include:', '["Wealth and power","Love, joy, peace","Fame and success","Money and possessions"]', 1, 'Galatians lists love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_life_003', 'subj_wassce_crs', 'topic_crs_living', 'Forgiveness in Christianity means:', '["Revenge on enemies","Letting go of resentment","Ignoring wrongdoing","Punishment"]', 1, 'Christian forgiveness involves releasing resentment and pardoning others.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_life_004', 'subj_wassce_crs', 'topic_crs_living', 'Prayer in Christianity is:', '["Optional","Communication with God","Only for emergencies","Only on Sundays"]', 1, 'Prayer is communicating with God through praise, thanksgiving, confession, and requests.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_life_005', 'subj_wassce_crs', 'topic_crs_living', 'The Lord''s Prayer begins with:', '["Help me Lord","Our Father in heaven","Dear God","Thank you God"]', 1, 'The Lord''s Prayer begins "Our Father in heaven, hallowed be your name..."', 'easy', 'multiple_choice', datetime('now'));
