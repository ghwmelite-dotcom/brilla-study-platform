-- Migration 034: Link BECE questions to their respective past papers
-- Updates past_paper_id for all BECE questions

-- BECE Mathematics 2024
UPDATE questions SET past_paper_id = 'pp_bece_math_2024_1' WHERE id LIKE 'q_bece_math_2024_%';

-- BECE Mathematics 2023
UPDATE questions SET past_paper_id = 'pp_bece_math_2023_1' WHERE id LIKE 'q_bece_math_2023_%';

-- BECE English 2024
UPDATE questions SET past_paper_id = 'pp_bece_eng_2024_1' WHERE id LIKE 'q_bece_eng_2024_%';

-- BECE English 2023
UPDATE questions SET past_paper_id = 'pp_bece_eng_2023_1' WHERE id LIKE 'q_bece_eng_2023_%';

-- BECE Integrated Science 2024
UPDATE questions SET past_paper_id = 'pp_bece_sci_2024_1' WHERE id LIKE 'q_bece_sci_2024_%';

-- BECE Integrated Science 2023
UPDATE questions SET past_paper_id = 'pp_bece_sci_2023_1' WHERE id LIKE 'q_bece_sci_2023_%';

-- BECE Social Studies 2024
UPDATE questions SET past_paper_id = 'pp_bece_soc_2024_1' WHERE id LIKE 'q_bece_soc_2024_%';

-- BECE Social Studies 2023
UPDATE questions SET past_paper_id = 'pp_bece_soc_2023_1' WHERE id LIKE 'q_bece_soc_2023_%';
