-- Migration 045: WASSCE Economics Questions
-- 50 questions for 2024 Paper 1 (Objectives)

-- First, add the past paper entry for Economics
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_eco_2024_1', 'exam_wassce', 'subj_wassce_economics', 'paper_wassce_1', 2024, 'May-June', 50, 50, 60, 1);

INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_eco_2023_1', 'exam_wassce', 'subj_wassce_economics', 'paper_wassce_1', 2023, 'May-June', 50, 50, 60, 1);

-- Economics Questions for 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Basic Economic Concepts (Questions 1-10)
('q_eco_2024_001', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Economics is best defined as the study of how:', 'multiple_choice', '["A. Government controls the economy", "B. Scarce resources are allocated to satisfy unlimited wants", "C. Money is created and distributed", "D. Businesses maximize profits"]', 'B', 'Economics fundamentally deals with the allocation of scarce resources to satisfy unlimited human wants.', 'easy', 1, 1),

('q_eco_2024_002', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The opportunity cost of a decision is:', 'multiple_choice', '["A. The total cost of the decision", "B. The money spent on the decision", "C. The value of the next best alternative forgone", "D. The profit made from the decision"]', 'C', 'Opportunity cost refers to what you give up (the next best alternative) when you make a choice.', 'easy', 1, 2),

('q_eco_2024_003', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Which of the following is NOT a factor of production?', 'multiple_choice', '["A. Land", "B. Labour", "C. Money", "D. Capital"]', 'C', 'The four factors of production are Land, Labour, Capital, and Entrepreneurship. Money is not a factor of production but a medium of exchange.', 'easy', 1, 3),

('q_eco_2024_004', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The reward for entrepreneurship is:', 'multiple_choice', '["A. Wages", "B. Rent", "C. Interest", "D. Profit"]', 'D', 'Wages reward labour, rent rewards land, interest rewards capital, and profit rewards entrepreneurship.', 'easy', 1, 4),

('q_eco_2024_005', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The production possibility curve shows:', 'multiple_choice', '["A. The actual output of an economy", "B. The maximum output combinations an economy can produce", "C. The minimum output of an economy", "D. The imports and exports of a country"]', 'B', 'The PPC illustrates the maximum combinations of two goods that can be produced with available resources.', 'medium', 1, 5),

('q_eco_2024_006', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'In a free market economy, resources are allocated primarily by:', 'multiple_choice', '["A. Government directives", "B. Price mechanism", "C. Traditional methods", "D. Central planning"]', 'B', 'In a free market economy, the price mechanism (forces of demand and supply) allocates resources.', 'easy', 1, 6),

('q_eco_2024_007', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'A mixed economy is characterized by:', 'multiple_choice', '["A. Only private ownership of resources", "B. Only government ownership of resources", "C. Both private and public sector participation", "D. No government intervention"]', 'C', 'A mixed economy combines elements of both market and planned economies, with both private and public sectors.', 'easy', 1, 7),

('q_eco_2024_008', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Scarcity in economics implies that:', 'multiple_choice', '["A. Goods are not available", "B. Resources are limited relative to wants", "C. There is no production", "D. Prices are too high"]', 'B', 'Scarcity means resources are limited while human wants are unlimited, forcing choices to be made.', 'easy', 1, 8),

('q_eco_2024_009', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Economic goods are different from free goods because economic goods:', 'multiple_choice', '["A. Are always expensive", "B. Have opportunity cost", "C. Are made by government", "D. Are not useful"]', 'B', 'Economic goods are scarce and have opportunity cost, while free goods (like air) are abundant and have no opportunity cost.', 'medium', 1, 9),

('q_eco_2024_010', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The basic economic problem is:', 'multiple_choice', '["A. Unemployment", "B. Inflation", "C. Scarcity", "D. Poverty"]', 'C', 'Scarcity is the fundamental economic problem - unlimited wants vs limited resources.', 'easy', 1, 10),

-- Demand and Supply (Questions 11-20)
('q_eco_2024_011', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The law of demand states that:', 'multiple_choice', '["A. As price increases, quantity demanded increases", "B. As price decreases, quantity demanded decreases", "C. As price increases, quantity demanded decreases, ceteris paribus", "D. Price and demand are not related"]', 'C', 'The law of demand shows an inverse relationship between price and quantity demanded, all other factors held constant.', 'easy', 1, 11),

('q_eco_2024_012', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'A movement along a demand curve is caused by:', 'multiple_choice', '["A. Change in consumer income", "B. Change in tastes and preferences", "C. Change in the price of the good itself", "D. Change in population"]', 'C', 'Movement along a demand curve is caused only by a change in the price of the good. Other factors shift the curve.', 'medium', 1, 12),

('q_eco_2024_013', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'When two goods are substitutes, an increase in the price of one will:', 'multiple_choice', '["A. Decrease demand for the other", "B. Increase demand for the other", "C. Have no effect on the other", "D. Decrease supply of the other"]', 'B', 'Substitutes are goods that can replace each other. Higher price of one increases demand for the other.', 'medium', 1, 13),

('q_eco_2024_014', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Equilibrium price is determined where:', 'multiple_choice', '["A. Demand exceeds supply", "B. Supply exceeds demand", "C. Demand equals supply", "D. Government sets the price"]', 'C', 'Market equilibrium occurs where quantity demanded equals quantity supplied.', 'easy', 1, 14),

('q_eco_2024_015', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Price elasticity of demand measures:', 'multiple_choice', '["A. How supply responds to price changes", "B. The responsiveness of quantity demanded to price changes", "C. The slope of the demand curve", "D. Total revenue changes"]', 'B', 'Price elasticity of demand (PED) measures how sensitive quantity demanded is to price changes.', 'medium', 1, 15),

('q_eco_2024_016', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'If demand is elastic, a decrease in price will lead to:', 'multiple_choice', '["A. Decrease in total revenue", "B. Increase in total revenue", "C. No change in total revenue", "D. Decrease in quantity demanded"]', 'B', 'With elastic demand (PED > 1), the percentage increase in quantity exceeds the percentage price decrease, raising total revenue.', 'hard', 1, 16),

('q_eco_2024_017', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Which of the following goods is likely to have inelastic demand?', 'multiple_choice', '["A. Luxury cars", "B. Salt", "C. Designer clothes", "D. Vacations"]', 'B', 'Necessities with few substitutes (like salt) tend to have inelastic demand - quantity demanded changes little with price.', 'medium', 1, 17),

('q_eco_2024_018', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'A price floor set above equilibrium will result in:', 'multiple_choice', '["A. Shortage", "B. Surplus", "C. Equilibrium", "D. No effect"]', 'B', 'A price floor above equilibrium (like minimum wage) creates surplus as quantity supplied exceeds quantity demanded.', 'medium', 1, 18),

('q_eco_2024_019', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Consumer surplus is:', 'multiple_choice', '["A. The extra goods consumers buy", "B. The difference between what consumers are willing to pay and what they actually pay", "C. The profit made by sellers", "D. Unsold goods in the market"]', 'B', 'Consumer surplus represents the benefit consumers get from paying less than their maximum willingness to pay.', 'hard', 1, 19),

('q_eco_2024_020', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The law of supply states that:', 'multiple_choice', '["A. As price rises, quantity supplied falls", "B. As price rises, quantity supplied rises, ceteris paribus", "C. Supply and price are unrelated", "D. Higher prices reduce production"]', 'B', 'The law of supply shows a positive relationship between price and quantity supplied.', 'easy', 1, 20),

-- Production and Costs (Questions 21-28)
('q_eco_2024_021', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The law of diminishing marginal returns states that:', 'multiple_choice', '["A. Output always decreases", "B. Adding more variable inputs eventually yields smaller increases in output", "C. Costs always increase", "D. Production is always inefficient"]', 'B', 'As more of a variable factor is added to fixed factors, marginal product eventually decreases.', 'medium', 1, 21),

('q_eco_2024_022', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Fixed costs are costs that:', 'multiple_choice', '["A. Change with output level", "B. Do not change with output level in the short run", "C. Are always zero", "D. Only occur in the long run"]', 'B', 'Fixed costs (rent, salaries) remain constant regardless of output in the short run.', 'easy', 1, 22),

('q_eco_2024_023', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Average cost is calculated as:', 'multiple_choice', '["A. Total cost × Output", "B. Total cost ÷ Output", "C. Marginal cost × Output", "D. Fixed cost + Variable cost"]', 'B', 'Average cost (AC) = Total cost (TC) / Quantity (Q).', 'easy', 1, 23),

('q_eco_2024_024', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Economies of scale refer to:', 'multiple_choice', '["A. Increasing costs as output expands", "B. Decreasing average costs as output expands", "C. Constant costs at all output levels", "D. Losses made by large firms"]', 'B', 'Economies of scale occur when average costs fall as the scale of production increases.', 'medium', 1, 24),

('q_eco_2024_025', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Division of labour refers to:', 'multiple_choice', '["A. Sharing profits among workers", "B. Breaking production into specialized tasks", "C. Dividing a company into departments", "D. Reducing the workforce"]', 'B', 'Division of labour involves breaking down production into specialized tasks performed by different workers.', 'easy', 1, 25),

('q_eco_2024_026', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The short run in economics is a period when:', 'multiple_choice', '["A. All factors are variable", "B. At least one factor is fixed", "C. No production takes place", "D. Only labor is used"]', 'B', 'In the short run, at least one factor of production is fixed; in the long run, all factors are variable.', 'medium', 1, 26),

('q_eco_2024_027', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Marginal cost is the:', 'multiple_choice', '["A. Total cost of production", "B. Average cost per unit", "C. Additional cost of producing one more unit", "D. Fixed cost of production"]', 'C', 'Marginal cost (MC) is the extra cost incurred from producing one additional unit of output.', 'easy', 1, 27),

('q_eco_2024_028', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Internal economies of scale arise from:', 'multiple_choice', '["A. Growth of the industry", "B. Growth of the individual firm", "C. Government subsidies", "D. Reduced taxation"]', 'B', 'Internal economies arise from the growth of the firm itself; external economies arise from industry growth.', 'medium', 1, 28),

-- Market Structures (Questions 29-35)
('q_eco_2024_029', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Perfect competition is characterized by:', 'multiple_choice', '["A. Few sellers", "B. Product differentiation", "C. Many buyers and sellers with homogeneous products", "D. High barriers to entry"]', 'C', 'Perfect competition features many buyers and sellers, identical products, and free entry/exit.', 'medium', 1, 29),

('q_eco_2024_030', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'A monopoly exists when:', 'multiple_choice', '["A. There are many sellers", "B. There is only one seller in the market", "C. Products are identical", "D. Entry is free"]', 'B', 'Monopoly is a market structure with a single seller controlling the entire market supply.', 'easy', 1, 30),

('q_eco_2024_031', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Monopolistic competition differs from perfect competition because:', 'multiple_choice', '["A. There are few sellers", "B. Products are differentiated", "C. There are barriers to entry", "D. Firms are price makers"]', 'B', 'Monopolistic competition has many sellers like perfect competition, but products are differentiated.', 'medium', 1, 31),

('q_eco_2024_032', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'An oligopoly market is dominated by:', 'multiple_choice', '["A. One firm", "B. Two firms only", "C. A few large firms", "D. Many small firms"]', 'C', 'Oligopoly is characterized by a few dominant firms with significant market power.', 'easy', 1, 32),

('q_eco_2024_033', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Price discrimination occurs when a firm:', 'multiple_choice', '["A. Charges the same price to all customers", "B. Charges different prices for the same product to different customers", "C. Reduces prices for everyone", "D. Increases quality"]', 'B', 'Price discrimination involves charging different prices to different consumers for the same product.', 'medium', 1, 33),

('q_eco_2024_034', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'A cartel is an agreement among:', 'multiple_choice', '["A. Consumers to buy together", "B. Firms to fix prices or output", "C. Workers to demand higher wages", "D. Government and firms"]', 'B', 'A cartel is a formal agreement among competing firms to coordinate prices, output, or market division.', 'medium', 1, 34),

('q_eco_2024_035', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'In perfect competition, firms are price takers because:', 'multiple_choice', '["A. Government sets prices", "B. Each firm is too small to influence market price", "C. There is only one buyer", "D. Products are differentiated"]', 'B', 'In perfect competition, individual firms are too small relative to the market to affect price.', 'medium', 1, 35),

-- Money, Banking and National Income (Questions 36-42)
('q_eco_2024_036', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Which is NOT a function of money?', 'multiple_choice', '["A. Medium of exchange", "B. Store of value", "C. Factor of production", "D. Unit of account"]', 'C', 'Money functions as medium of exchange, store of value, unit of account, and standard of deferred payment - but not as a factor of production.', 'easy', 1, 36),

('q_eco_2024_037', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The central bank of Ghana is the:', 'multiple_choice', '["A. Ghana Commercial Bank", "B. Bank of Ghana", "C. Barclays Bank", "D. World Bank"]', 'B', 'The Bank of Ghana is Ghana''s central bank, responsible for monetary policy.', 'easy', 1, 37),

('q_eco_2024_038', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Commercial banks create money through:', 'multiple_choice', '["A. Printing currency", "B. The credit creation process", "C. Selling gold", "D. Government grants"]', 'B', 'Commercial banks create money through the credit creation (money multiplier) process.', 'medium', 1, 38),

('q_eco_2024_039', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Inflation is defined as:', 'multiple_choice', '["A. A fall in prices", "B. A sustained increase in the general price level", "C. An increase in output", "D. A decrease in money supply"]', 'B', 'Inflation is a persistent rise in the general level of prices over time.', 'easy', 1, 39),

('q_eco_2024_040', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'GDP stands for:', 'multiple_choice', '["A. General Domestic Product", "B. Gross Domestic Product", "C. Government Domestic Policy", "D. Gross Domestic Price"]', 'B', 'GDP (Gross Domestic Product) is the total value of goods and services produced within a country.', 'easy', 1, 40),

('q_eco_2024_041', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The multiplier effect in economics shows that:', 'multiple_choice', '["A. Income decreases over time", "B. An initial injection leads to a larger final increase in national income", "C. Savings always equal investment", "D. Taxes reduce spending"]', 'B', 'The multiplier shows how an initial change in spending leads to a larger change in national income.', 'hard', 1, 41),

('q_eco_2024_042', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Monetary policy involves:', 'multiple_choice', '["A. Government spending decisions", "B. Central bank control of money supply and interest rates", "C. Tax changes", "D. Trade restrictions"]', 'B', 'Monetary policy is the central bank''s use of interest rates and money supply to influence the economy.', 'medium', 1, 42),

-- International Trade and Development (Questions 43-50)
('q_eco_2024_043', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Absolute advantage means a country can:', 'multiple_choice', '["A. Produce everything cheaper", "B. Produce a good using fewer resources than another country", "C. Export more than it imports", "D. Have no trade barriers"]', 'B', 'Absolute advantage exists when a country can produce a good with fewer resources than another.', 'medium', 1, 43),

('q_eco_2024_044', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'A tariff is:', 'multiple_choice', '["A. A subsidy on exports", "B. A tax on imports", "C. A limit on imports", "D. A ban on trade"]', 'B', 'A tariff is a tax imposed on imported goods to protect domestic industries.', 'easy', 1, 44),

('q_eco_2024_045', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The balance of trade is:', 'multiple_choice', '["A. Total imports plus exports", "B. The difference between visible exports and visible imports", "C. All international transactions", "D. Only service trade"]', 'B', 'Balance of trade = Value of exports of goods minus value of imports of goods.', 'medium', 1, 45),

('q_eco_2024_046', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Exchange rate is:', 'multiple_choice', '["A. The interest rate on loans", "B. The price of one currency in terms of another", "C. The inflation rate", "D. The tax rate on imports"]', 'B', 'Exchange rate is the rate at which one currency can be exchanged for another.', 'easy', 1, 46),

('q_eco_2024_047', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'ECOWAS stands for:', 'multiple_choice', '["A. Economic Community of West African States", "B. European Community of Western African States", "C. Economic Council of West African Services", "D. Eastern Community of West African States"]', 'A', 'ECOWAS is the Economic Community of West African States, a regional economic union.', 'easy', 1, 47),

('q_eco_2024_048', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Economic development differs from economic growth because development:', 'multiple_choice', '["A. Only measures GDP increase", "B. Includes improvements in living standards, health, and education", "C. Is easier to measure", "D. Occurs only in rich countries"]', 'B', 'Development is broader than growth, encompassing quality of life improvements, not just output increases.', 'medium', 1, 48),

('q_eco_2024_049', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'The Human Development Index (HDI) measures:', 'multiple_choice', '["A. Only income", "B. Income, education, and life expectancy", "C. Only population growth", "D. Trade balance"]', 'B', 'HDI combines life expectancy, education (literacy and enrollment), and income (GDP per capita).', 'medium', 1, 49),

('q_eco_2024_050', 'subj_wassce_economics', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_eco_2024_1', 'Foreign direct investment (FDI) refers to:', 'multiple_choice', '["A. Loans from foreign governments", "B. Investment by foreign companies in productive assets in another country", "C. Aid from international organizations", "D. Buying foreign currency"]', 'B', 'FDI involves establishing business operations or acquiring business assets in a foreign country.', 'medium', 1, 50);
