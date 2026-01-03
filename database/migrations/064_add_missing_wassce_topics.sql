-- Migration: Add topics and questions for missing WASSCE subjects
-- Subjects: Financial Accounting, Economics, Literature, Government, Geography, CRS

-- =============================================
-- FINANCIAL ACCOUNTING TOPICS
-- =============================================
INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at) VALUES
('topic_acc_intro', 'subj_wassce_accounting', 'Introduction to Accounting', 'intro-accounting', 'Basic concepts, principles, and users of accounting information', 1, datetime('now')),
('topic_acc_books', 'subj_wassce_accounting', 'Books of Original Entry', 'books-original-entry', 'Journals, day books, and recording transactions', 2, datetime('now')),
('topic_acc_ledger', 'subj_wassce_accounting', 'Ledger Accounts', 'ledger-accounts', 'Double-entry bookkeeping and posting to ledgers', 3, datetime('now')),
('topic_acc_trial', 'subj_wassce_accounting', 'Trial Balance', 'trial-balance', 'Preparation and purpose of trial balance', 4, datetime('now')),
('topic_acc_errors', 'subj_wassce_accounting', 'Errors and Suspense Accounts', 'errors-suspense', 'Types of errors and correction methods', 5, datetime('now')),
('topic_acc_bank', 'subj_wassce_accounting', 'Bank Reconciliation', 'bank-reconciliation', 'Preparing bank reconciliation statements', 6, datetime('now')),
('topic_acc_depreciation', 'subj_wassce_accounting', 'Depreciation of Assets', 'depreciation', 'Methods of calculating depreciation', 7, datetime('now')),
('topic_acc_final', 'subj_wassce_accounting', 'Final Accounts', 'final-accounts', 'Trading, profit and loss accounts, and balance sheets', 8, datetime('now')),
('topic_acc_partnership', 'subj_wassce_accounting', 'Partnership Accounts', 'partnership-accounts', 'Accounting for partnerships and profit sharing', 9, datetime('now')),
('topic_acc_nonprofit', 'subj_wassce_accounting', 'Non-Profit Organizations', 'nonprofit-accounts', 'Receipts and payments, income and expenditure accounts', 10, datetime('now'));

-- =============================================
-- ECONOMICS TOPICS
-- =============================================
INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at) VALUES
('topic_eco_intro', 'subj_wassce_economics', 'Introduction to Economics', 'intro-economics', 'Basic economic concepts, scarcity, and choice', 1, datetime('now')),
('topic_eco_demand', 'subj_wassce_economics', 'Demand and Supply', 'demand-supply', 'Laws of demand and supply, price determination', 2, datetime('now')),
('topic_eco_elasticity', 'subj_wassce_economics', 'Elasticity', 'elasticity', 'Price, income, and cross elasticity of demand', 3, datetime('now')),
('topic_eco_production', 'subj_wassce_economics', 'Theory of Production', 'production-theory', 'Factors of production, laws of returns', 4, datetime('now')),
('topic_eco_costs', 'subj_wassce_economics', 'Costs and Revenue', 'costs-revenue', 'Fixed, variable, marginal costs and revenues', 5, datetime('now')),
('topic_eco_markets', 'subj_wassce_economics', 'Market Structures', 'market-structures', 'Perfect competition, monopoly, oligopoly', 6, datetime('now')),
('topic_eco_national', 'subj_wassce_economics', 'National Income', 'national-income', 'GDP, GNP, and methods of measurement', 7, datetime('now')),
('topic_eco_money', 'subj_wassce_economics', 'Money and Banking', 'money-banking', 'Functions of money, commercial and central banking', 8, datetime('now')),
('topic_eco_trade', 'subj_wassce_economics', 'International Trade', 'international-trade', 'Balance of payments, exchange rates, trade policies', 9, datetime('now'));

-- =============================================
-- LITERATURE IN ENGLISH TOPICS
-- =============================================
INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at) VALUES
('topic_lit_intro', 'subj_wassce_literature', 'Introduction to Literature', 'intro-literature', 'Literary terms, genres, and appreciation', 1, datetime('now')),
('topic_lit_poetry', 'subj_wassce_literature', 'Poetry Analysis', 'poetry-analysis', 'Analyzing poems, literary devices in poetry', 2, datetime('now')),
('topic_lit_prose', 'subj_wassce_literature', 'Prose Fiction', 'prose-fiction', 'Novel and short story analysis', 3, datetime('now')),
('topic_lit_drama', 'subj_wassce_literature', 'Drama', 'drama', 'Elements of drama and play analysis', 4, datetime('now')),
('topic_lit_african', 'subj_wassce_literature', 'African Literature', 'african-literature', 'Themes and styles in African writing', 5, datetime('now')),
('topic_lit_devices', 'subj_wassce_literature', 'Literary Devices', 'literary-devices', 'Metaphor, simile, personification, irony', 6, datetime('now'));

-- =============================================
-- GOVERNMENT TOPICS
-- =============================================
INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at) VALUES
('topic_gov_intro', 'subj_wassce_government', 'Introduction to Government', 'intro-government', 'Basic concepts, state, nation, and government', 1, datetime('now')),
('topic_gov_constitution', 'subj_wassce_government', 'Constitutions', 'constitutions', 'Types, sources, and features of constitutions', 2, datetime('now')),
('topic_gov_organs', 'subj_wassce_government', 'Organs of Government', 'organs-government', 'Legislature, executive, and judiciary', 3, datetime('now')),
('topic_gov_systems', 'subj_wassce_government', 'Systems of Government', 'systems-government', 'Unitary, federal, presidential, parliamentary', 4, datetime('now')),
('topic_gov_parties', 'subj_wassce_government', 'Political Parties', 'political-parties', 'Types, functions, and party systems', 5, datetime('now')),
('topic_gov_elections', 'subj_wassce_government', 'Elections', 'elections', 'Electoral systems and voting behavior', 6, datetime('now')),
('topic_gov_rights', 'subj_wassce_government', 'Citizenship and Rights', 'citizenship-rights', 'Fundamental human rights and duties', 7, datetime('now')),
('topic_gov_ghana', 'subj_wassce_government', 'Government of Ghana', 'government-ghana', 'Political history and current constitution', 8, datetime('now'));

-- =============================================
-- GEOGRAPHY TOPICS
-- =============================================
INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at) VALUES
('topic_geo_physical', 'subj_wassce_geography', 'Physical Geography', 'physical-geography', 'Earth structure, rocks, and landforms', 1, datetime('now')),
('topic_geo_climate', 'subj_wassce_geography', 'Weather and Climate', 'weather-climate', 'Elements of weather, climate types', 2, datetime('now')),
('topic_geo_vegetation', 'subj_wassce_geography', 'Vegetation and Soils', 'vegetation-soils', 'World vegetation zones and soil types', 3, datetime('now')),
('topic_geo_population', 'subj_wassce_geography', 'Population Studies', 'population-studies', 'Population growth, distribution, migration', 4, datetime('now')),
('topic_geo_settlement', 'subj_wassce_geography', 'Settlement', 'settlement', 'Rural and urban settlements, urbanization', 5, datetime('now')),
('topic_geo_resources', 'subj_wassce_geography', 'Natural Resources', 'natural-resources', 'Renewable and non-renewable resources', 6, datetime('now')),
('topic_geo_mapwork', 'subj_wassce_geography', 'Map Reading', 'map-reading', 'Scale, coordinates, contours, cross-sections', 7, datetime('now')),
('topic_geo_ghana', 'subj_wassce_geography', 'Geography of Ghana', 'geography-ghana', 'Physical and human geography of Ghana', 8, datetime('now')),
('topic_geo_africa', 'subj_wassce_geography', 'Geography of Africa', 'geography-africa', 'African regions and economic activities', 9, datetime('now'));

-- =============================================
-- CHRISTIAN RELIGIOUS STUDIES TOPICS
-- =============================================
INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order, created_at) VALUES
('topic_crs_creation', 'subj_wassce_crs', 'Creation and Fall', 'creation-fall', 'Genesis account of creation and the fall of man', 1, datetime('now')),
('topic_crs_patriarchs', 'subj_wassce_crs', 'The Patriarchs', 'patriarchs', 'Abraham, Isaac, Jacob, and Joseph', 2, datetime('now')),
('topic_crs_moses', 'subj_wassce_crs', 'Moses and the Exodus', 'moses-exodus', 'Deliverance from Egypt and the Law', 3, datetime('now')),
('topic_crs_kings', 'subj_wassce_crs', 'Kings and Prophets', 'kings-prophets', 'Monarchy in Israel and prophetic messages', 4, datetime('now')),
('topic_crs_jesus', 'subj_wassce_crs', 'Life of Jesus', 'life-jesus', 'Birth, ministry, teachings of Jesus Christ', 5, datetime('now')),
('topic_crs_parables', 'subj_wassce_crs', 'Parables and Miracles', 'parables-miracles', 'Teachings through parables and miraculous works', 6, datetime('now')),
('topic_crs_passion', 'subj_wassce_crs', 'Passion and Resurrection', 'passion-resurrection', 'Death, burial, and resurrection of Christ', 7, datetime('now')),
('topic_crs_church', 'subj_wassce_crs', 'The Early Church', 'early-church', 'Acts of the Apostles and church growth', 8, datetime('now'));

-- =============================================
-- SAMPLE QUESTIONS - FINANCIAL ACCOUNTING
-- =============================================
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_acc_001', 'subj_wassce_accounting', 'topic_acc_intro', 'Which of the following is NOT a user of accounting information?', '["Shareholders","Government","Competitors for personal gain","Creditors"]', 2, 'While competitors may analyze public financial information, using it solely for personal gain is not a legitimate use. Shareholders, government, and creditors are all recognized users of accounting information.', 'medium', 'multiple_choice', datetime('now')),
('q_acc_002', 'subj_wassce_accounting', 'topic_acc_books', 'The Sales Day Book is used to record:', '["Cash sales only","Credit sales only","Both cash and credit sales","Returns from customers"]', 1, 'The Sales Day Book (or Sales Journal) records only credit sales. Cash sales are recorded in the Cash Book.', 'easy', 'multiple_choice', datetime('now')),
('q_acc_003', 'subj_wassce_accounting', 'topic_acc_ledger', 'In double-entry bookkeeping, when goods are sold on credit, the entries are:', '["Debit Sales, Credit Debtor","Debit Debtor, Credit Sales","Debit Cash, Credit Sales","Debit Sales, Credit Cash"]', 1, 'When goods are sold on credit, the debtor (customer) account is debited (asset increases) and Sales account is credited (income increases).', 'medium', 'multiple_choice', datetime('now')),
('q_acc_004', 'subj_wassce_accounting', 'topic_acc_trial', 'A trial balance proves that:', '["All transactions are correctly recorded","The books are arithmetically accurate","No errors exist in the books","The business is profitable"]', 1, 'A trial balance only proves arithmetic accuracy - that debits equal credits. It does not detect errors of principle, commission, or compensating errors.', 'medium', 'multiple_choice', datetime('now')),
('q_acc_005', 'subj_wassce_accounting', 'topic_acc_depreciation', 'Using the straight-line method, an asset costing GHS 50,000 with a residual value of GHS 5,000 and useful life of 9 years has annual depreciation of:', '["GHS 5,000","GHS 5,556","GHS 4,500","GHS 6,000"]', 0, 'Straight-line depreciation = (Cost - Residual Value) / Useful Life = (50,000 - 5,000) / 9 = 45,000 / 9 = GHS 5,000 per year.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- SAMPLE QUESTIONS - ECONOMICS
-- =============================================
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_eco_001', 'subj_wassce_economics', 'topic_eco_intro', 'The basic economic problem arises because:', '["Wants are limited","Resources are unlimited","Wants are unlimited but resources are scarce","Money is scarce"]', 2, 'The fundamental economic problem is scarcity - human wants are unlimited but the resources to satisfy them are limited, forcing us to make choices.', 'easy', 'multiple_choice', datetime('now')),
('q_eco_002', 'subj_wassce_economics', 'topic_eco_demand', 'When the price of a good falls, the quantity demanded rises. This illustrates:', '["The law of supply","The law of demand","Price elasticity","Income effect"]', 1, 'The law of demand states that there is an inverse relationship between price and quantity demanded, ceteris paribus.', 'easy', 'multiple_choice', datetime('now')),
('q_eco_003', 'subj_wassce_economics', 'topic_eco_elasticity', 'If a 10% increase in price leads to a 15% decrease in quantity demanded, demand is:', '["Inelastic","Elastic","Unitary elastic","Perfectly inelastic"]', 1, 'Price elasticity = % change in Qd / % change in P = 15/10 = 1.5. Since PED > 1, demand is elastic.', 'medium', 'multiple_choice', datetime('now')),
('q_eco_004', 'subj_wassce_economics', 'topic_eco_markets', 'A market with many buyers and sellers, homogeneous products, and free entry/exit is:', '["Monopoly","Oligopoly","Perfect competition","Monopolistic competition"]', 2, 'Perfect competition is characterized by many buyers and sellers, homogeneous products, perfect information, and free entry and exit.', 'medium', 'multiple_choice', datetime('now')),
('q_eco_005', 'subj_wassce_economics', 'topic_eco_money', 'Which is NOT a function of money?', '["Medium of exchange","Store of value","Creating inflation","Unit of account"]', 2, 'The functions of money are: medium of exchange, store of value, unit of account, and standard of deferred payment. Creating inflation is not a function of money.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- SAMPLE QUESTIONS - LITERATURE
-- =============================================
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_lit_001', 'subj_wassce_literature', 'topic_lit_devices', 'The comparison of two unlike things using "like" or "as" is called:', '["Metaphor","Simile","Personification","Hyperbole"]', 1, 'A simile is a figure of speech that compares two different things using "like" or "as". Example: "Her smile was like sunshine."', 'easy', 'multiple_choice', datetime('now')),
('q_lit_002', 'subj_wassce_literature', 'topic_lit_poetry', 'A 14-line poem with a specific rhyme scheme is called:', '["Ode","Sonnet","Ballad","Epic"]', 1, 'A sonnet is a 14-line poem, typically in iambic pentameter, with specific rhyme schemes (Shakespearean or Petrarchan).', 'easy', 'multiple_choice', datetime('now')),
('q_lit_003', 'subj_wassce_literature', 'topic_lit_drama', 'The turning point in a play or story is called the:', '["Exposition","Rising action","Climax","Resolution"]', 2, 'The climax is the turning point or highest point of tension in a story, where the main conflict reaches its peak.', 'medium', 'multiple_choice', datetime('now')),
('q_lit_004', 'subj_wassce_literature', 'topic_lit_devices', 'When inanimate objects are given human qualities, this is:', '["Metaphor","Irony","Personification","Alliteration"]', 2, 'Personification is giving human characteristics to non-human things. Example: "The wind whispered through the trees."', 'easy', 'multiple_choice', datetime('now')),
('q_lit_005', 'subj_wassce_literature', 'topic_lit_prose', 'The perspective from which a story is told is called:', '["Theme","Plot","Point of view","Setting"]', 2, 'Point of view refers to who is telling the story (first person, third person limited, third person omniscient, etc.).', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- SAMPLE QUESTIONS - GOVERNMENT
-- =============================================
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_gov_001', 'subj_wassce_government', 'topic_gov_intro', 'The institution through which the state exercises its authority is called:', '["Nation","Country","Government","Society"]', 2, 'Government is the institution through which the state exercises its authority to make and enforce laws and policies.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_002', 'subj_wassce_government', 'topic_gov_constitution', 'A rigid constitution is one that:', '["Can be easily amended","Requires special procedures to amend","Is unwritten","Has no amendment process"]', 1, 'A rigid constitution requires special procedures (like supermajority votes or referendums) to be amended, unlike a flexible constitution.', 'medium', 'multiple_choice', datetime('now')),
('q_gov_003', 'subj_wassce_government', 'topic_gov_organs', 'The arm of government responsible for making laws is the:', '["Executive","Legislature","Judiciary","Civil Service"]', 1, 'The Legislature (Parliament/Congress) is responsible for making laws. The Executive implements laws, and the Judiciary interprets them.', 'easy', 'multiple_choice', datetime('now')),
('q_gov_004', 'subj_wassce_government', 'topic_gov_systems', 'In a federal system of government:', '["Power is concentrated at the center","Power is shared between central and regional governments","There is only one level of government","The president has absolute power"]', 1, 'Federalism involves the constitutional division of powers between the central (federal) government and regional (state) governments.', 'medium', 'multiple_choice', datetime('now')),
('q_gov_005', 'subj_wassce_government', 'topic_gov_ghana', 'Ghana returned to constitutional rule in the Fourth Republic in:', '["1957","1981","1992","2000"]', 2, 'Ghana''s Fourth Republic began on January 7, 1993, following the 1992 constitution and elections.', 'medium', 'multiple_choice', datetime('now'));

-- =============================================
-- SAMPLE QUESTIONS - GEOGRAPHY
-- =============================================
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_geo_001', 'subj_wassce_geography', 'topic_geo_physical', 'The three main types of rocks are:', '["Granite, marble, slate","Igneous, sedimentary, metamorphic","Volcanic, plutonic, organic","Primary, secondary, tertiary"]', 1, 'Rocks are classified into three main types: igneous (from molten magma), sedimentary (from deposited materials), and metamorphic (transformed by heat/pressure).', 'easy', 'multiple_choice', datetime('now')),
('q_geo_002', 'subj_wassce_geography', 'topic_geo_climate', 'The instrument used to measure atmospheric pressure is:', '["Thermometer","Anemometer","Barometer","Hygrometer"]', 2, 'A barometer measures atmospheric pressure. Thermometer measures temperature, anemometer measures wind speed, and hygrometer measures humidity.', 'easy', 'multiple_choice', datetime('now')),
('q_geo_003', 'subj_wassce_geography', 'topic_geo_population', 'The movement of people from rural to urban areas is called:', '["Immigration","Emigration","Rural-urban migration","Urbanization"]', 2, 'Rural-urban migration is the movement of people from countryside to cities. Urbanization is the overall process of urban growth.', 'easy', 'multiple_choice', datetime('now')),
('q_geo_004', 'subj_wassce_geography', 'topic_geo_mapwork', 'On a map with scale 1:50,000, a distance of 4cm represents:', '["2 km","4 km","20 km","50 km"]', 0, '1:50,000 means 1cm = 50,000cm = 500m = 0.5km. Therefore, 4cm = 4 x 0.5km = 2km.', 'medium', 'multiple_choice', datetime('now')),
('q_geo_005', 'subj_wassce_geography', 'topic_geo_ghana', 'The largest lake in Ghana is:', '["Lake Bosomtwe","Lake Volta","Lake Chad","Lake Victoria"]', 1, 'Lake Volta is the largest lake in Ghana and one of the largest man-made lakes in the world, created by the Akosombo Dam.', 'easy', 'multiple_choice', datetime('now'));

-- =============================================
-- SAMPLE QUESTIONS - CHRISTIAN RELIGIOUS STUDIES
-- =============================================
INSERT INTO questions (id, subject_id, topic_id, question_text, options, correct_answer, explanation, difficulty, question_type, created_at) VALUES
('q_crs_001', 'subj_wassce_crs', 'topic_crs_creation', 'According to Genesis, on which day did God create man?', '["Fifth day","Sixth day","Seventh day","Fourth day"]', 1, 'According to Genesis 1:26-31, God created man on the sixth day of creation.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_002', 'subj_wassce_crs', 'topic_crs_patriarchs', 'God changed Abram''s name to Abraham, which means:', '["Father of nations","Friend of God","Blessed one","Man of faith"]', 0, 'In Genesis 17:5, God changed Abram''s name to Abraham, meaning "father of many nations" as a sign of the covenant.', 'medium', 'multiple_choice', datetime('now')),
('q_crs_003', 'subj_wassce_crs', 'topic_crs_moses', 'The Ten Commandments were given to Moses at:', '["Mount Carmel","Mount Sinai","Mount Zion","Mount Moriah"]', 1, 'God gave Moses the Ten Commandments on Mount Sinai (also called Mount Horeb) as recorded in Exodus 20.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_004', 'subj_wassce_crs', 'topic_crs_jesus', 'Jesus was born in:', '["Jerusalem","Nazareth","Bethlehem","Capernaum"]', 2, 'According to Matthew 2:1 and Luke 2:4-7, Jesus was born in Bethlehem of Judea.', 'easy', 'multiple_choice', datetime('now')),
('q_crs_005', 'subj_wassce_crs', 'topic_crs_parables', 'The Parable of the Good Samaritan teaches about:', '["Prayer","Love for neighbor","Forgiveness","Faith"]', 1, 'The Parable of the Good Samaritan (Luke 10:25-37) teaches about showing compassion and love to all people, regardless of social or ethnic differences.', 'medium', 'multiple_choice', datetime('now'));
