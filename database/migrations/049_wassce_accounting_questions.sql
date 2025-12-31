-- Migration 049: WASSCE Financial Accounting Questions
-- 100 questions for 2024 and 2023 Paper 1 (Objectives)

-- First, add the past paper entries for Financial Accounting
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_acc_2024_1', 'exam_wassce', 'subj_wassce_accounting', 'paper_wassce_1', 2024, 'May-June', 50, 50, 60, 1);

INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_acc_2023_1', 'exam_wassce', 'subj_wassce_accounting', 'paper_wassce_1', 2023, 'May-June', 50, 50, 60, 1);

-- Financial Accounting Questions for 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Basic Accounting Concepts (Q1-10)
('q_acc_2024_001', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The accounting equation is:', 'multiple_choice', '["A. Assets = Liabilities - Capital", "B. Assets = Liabilities + Capital", "C. Assets + Liabilities = Capital", "D. Capital = Assets + Liabilities"]', 'B', 'The accounting equation is Assets = Liabilities + Capital (Owner''s Equity).', 'easy', 1, 1),

('q_acc_2024_002', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Which of the following is a source document?', 'multiple_choice', '["A. Trial balance", "B. Invoice", "C. Journal", "D. Ledger"]', 'B', 'An invoice is a source document that provides evidence of a transaction.', 'easy', 1, 2),

('q_acc_2024_003', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The principle that requires expenses to be recorded in the same period as related revenues is:', 'multiple_choice', '["A. Going concern", "B. Matching principle", "C. Prudence", "D. Consistency"]', 'B', 'The matching principle requires expenses to be matched with the revenues they help generate.', 'medium', 1, 3),

('q_acc_2024_004', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The double entry principle requires that:', 'multiple_choice', '["A. Every transaction has only one entry", "B. Every debit has a corresponding credit", "C. All entries are made in the cash book", "D. Only credit transactions are recorded"]', 'B', 'Double entry requires every debit to have an equal and corresponding credit entry.', 'easy', 1, 4),

('q_acc_2024_005', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Which of these is a current asset?', 'multiple_choice', '["A. Land", "B. Motor vehicle", "C. Inventory", "D. Machinery"]', 'C', 'Inventory (stock) is a current asset expected to be converted to cash within one year.', 'easy', 1, 5),

('q_acc_2024_006', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The book of original entry for credit sales is:', 'multiple_choice', '["A. Cash book", "B. Sales journal", "C. Purchases journal", "D. General journal"]', 'B', 'The sales journal (sales day book) records all credit sales.', 'easy', 1, 6),

('q_acc_2024_007', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Carriage inwards is added to:', 'multiple_choice', '["A. Sales", "B. Purchases", "C. Closing stock", "D. Gross profit"]', 'B', 'Carriage inwards (freight in) is added to the cost of purchases.', 'medium', 1, 7),

('q_acc_2024_008', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The concept that assumes a business will continue indefinitely is:', 'multiple_choice', '["A. Accrual concept", "B. Going concern", "C. Prudence", "D. Consistency"]', 'B', 'The going concern concept assumes the business will continue operating for the foreseeable future.', 'easy', 1, 8),

('q_acc_2024_009', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Trade discount is:', 'multiple_choice', '["A. Recorded in the books", "B. Deducted from invoice before recording", "C. Added to the selling price", "D. Only given for cash sales"]', 'B', 'Trade discount is deducted before recording; only the net amount is recorded.', 'medium', 1, 9),

('q_acc_2024_010', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The purpose of a trial balance is to:', 'multiple_choice', '["A. Calculate profit", "B. Check arithmetical accuracy", "C. Prepare financial statements", "D. Record transactions"]', 'B', 'A trial balance verifies that debits equal credits (arithmetical accuracy).', 'easy', 1, 10),

-- Books of Account and Ledgers (Q11-20)
('q_acc_2024_011', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The three-column cash book records:', 'multiple_choice', '["A. Cash only", "B. Bank only", "C. Cash, bank and discount", "D. Cash and petty cash"]', 'C', 'A three-column cash book has columns for cash, bank, and discount.', 'easy', 1, 11),

('q_acc_2024_012', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The petty cash book is maintained using:', 'multiple_choice', '["A. Single entry system", "B. Imprest system", "C. Double entry system", "D. Receipt system"]', 'B', 'The imprest system maintains a fixed petty cash float that is reimbursed periodically.', 'medium', 1, 12),

('q_acc_2024_013', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'A credit balance on a debtor''s account indicates:', 'multiple_choice', '["A. Amount owed by debtor", "B. Amount owed to debtor (overpayment)", "C. Discount allowed", "D. Bad debt"]', 'B', 'A credit balance in a debtor''s account means the customer has overpaid.', 'medium', 1, 13),

('q_acc_2024_014', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Contra entry involves:', 'multiple_choice', '["A. Two separate books", "B. Cash and bank columns of the same cash book", "C. Sales and purchases journals", "D. Journal and ledger"]', 'B', 'A contra entry is a transfer between cash and bank columns in the cash book.', 'medium', 1, 14),

('q_acc_2024_015', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The sales ledger contains accounts of:', 'multiple_choice', '["A. Creditors", "B. Debtors", "C. Assets", "D. Expenses"]', 'B', 'The sales ledger (debtors ledger) contains individual customer accounts.', 'easy', 1, 15),

('q_acc_2024_016', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'When goods are returned by a customer, the entry is:', 'multiple_choice', '["A. Debit Sales, Credit Customer", "B. Debit Sales Returns, Credit Customer", "C. Debit Customer, Credit Sales Returns", "D. Debit Cash, Credit Sales"]', 'B', 'Sales returns is debited and the customer''s account is credited.', 'medium', 1, 16),

('q_acc_2024_017', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The general journal is used for:', 'multiple_choice', '["A. Cash transactions", "B. Credit sales", "C. Opening entries and corrections", "D. Bank transactions"]', 'C', 'The general journal records opening entries, adjustments, and corrections not in other journals.', 'medium', 1, 17),

('q_acc_2024_018', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'A folio reference helps to:', 'multiple_choice', '["A. Calculate totals", "B. Cross-reference between books", "C. Find errors", "D. Balance accounts"]', 'B', 'Folio references provide cross-references between journals and ledgers for easy tracing.', 'easy', 1, 18),

('q_acc_2024_019', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Discount received is recorded in the:', 'multiple_choice', '["A. Debit side of cash book", "B. Credit side of cash book", "C. Credit side of purchases account", "D. Debit side of sales account"]', 'B', 'Discount received is recorded on the credit side of the cash book (discount column).', 'medium', 1, 19),

('q_acc_2024_020', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The purchases ledger control account has a:', 'multiple_choice', '["A. Debit balance", "B. Credit balance", "C. Zero balance", "D. Either debit or credit"]', 'B', 'The purchases ledger control account normally has a credit balance (amounts owed to creditors).', 'medium', 1, 20),

-- Financial Statements (Q21-30)
('q_acc_2024_021', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Gross profit is calculated as:', 'multiple_choice', '["A. Sales - Expenses", "B. Sales - Cost of Goods Sold", "C. Net profit + Expenses", "D. Cost of Sales + Expenses"]', 'B', 'Gross Profit = Sales - Cost of Goods Sold.', 'easy', 1, 21),

('q_acc_2024_022', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Cost of goods sold equals:', 'multiple_choice', '["A. Opening stock + Purchases - Closing stock", "B. Purchases only", "C. Opening stock + Closing stock", "D. Purchases - Returns"]', 'A', 'COGS = Opening Stock + Purchases - Closing Stock (adjusted for carriage inwards and returns).', 'medium', 1, 22),

('q_acc_2024_023', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Closing stock appears in:', 'multiple_choice', '["A. Trial balance only", "B. Trading account only", "C. Trading account and balance sheet", "D. Balance sheet only"]', 'C', 'Closing stock appears in the trading account and as a current asset in the balance sheet.', 'medium', 1, 23),

('q_acc_2024_024', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Carriage outwards is treated as:', 'multiple_choice', '["A. Cost of goods sold", "B. A selling expense", "C. Purchase cost", "D. An asset"]', 'B', 'Carriage outwards (delivery expense) is a selling and distribution expense.', 'medium', 1, 24),

('q_acc_2024_025', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Net profit is:', 'multiple_choice', '["A. Gross profit - Expenses + Incomes", "B. Sales - All costs", "C. Gross profit + Expenses", "D. Total revenue only"]', 'A', 'Net Profit = Gross Profit - Operating Expenses + Other Incomes.', 'medium', 1, 25),

('q_acc_2024_026', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Which of these is a current liability?', 'multiple_choice', '["A. Bank loan (5 years)", "B. Trade payables", "C. Capital", "D. Premises"]', 'B', 'Trade payables (creditors) are current liabilities due within one year.', 'easy', 1, 26),

('q_acc_2024_027', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Prepaid expenses are shown as:', 'multiple_choice', '["A. Current liabilities", "B. Current assets", "C. Expenses in P&L", "D. Non-current assets"]', 'B', 'Prepaid expenses are current assets (amounts paid in advance for future benefits).', 'medium', 1, 27),

('q_acc_2024_028', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Accrued expenses are:', 'multiple_choice', '["A. Paid in advance", "B. Expenses owing but not yet paid", "C. Non-business expenses", "D. Written off expenses"]', 'B', 'Accrued expenses are incurred but not yet paid at the end of the accounting period.', 'medium', 1, 28),

('q_acc_2024_029', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Working capital is:', 'multiple_choice', '["A. Total assets", "B. Current assets - Current liabilities", "C. Fixed assets only", "D. Cash only"]', 'B', 'Working Capital = Current Assets - Current Liabilities.', 'easy', 1, 29),

('q_acc_2024_030', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Capital at the end of the year equals:', 'multiple_choice', '["A. Opening capital + Profit - Drawings", "B. Opening capital only", "C. Assets - Expenses", "D. Profit - Loss"]', 'A', 'Closing Capital = Opening Capital + Net Profit - Drawings (+ additional capital).', 'medium', 1, 30),

-- Depreciation and Bad Debts (Q31-40)
('q_acc_2024_031', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Depreciation represents:', 'multiple_choice', '["A. Market value decline", "B. Allocation of asset cost over useful life", "C. Repair costs", "D. Insurance of assets"]', 'B', 'Depreciation allocates the cost of a fixed asset over its estimated useful life.', 'easy', 1, 31),

('q_acc_2024_032', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Under straight-line method, annual depreciation equals:', 'multiple_choice', '["A. (Cost - Residual value) × Rate", "B. (Cost - Residual value) ÷ Useful life", "C. Cost × Rate", "D. Book value × Rate"]', 'B', 'Straight-line depreciation = (Cost - Residual Value) ÷ Useful Life.', 'medium', 1, 32),

('q_acc_2024_033', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The reducing balance method calculates depreciation on:', 'multiple_choice', '["A. Original cost", "B. Net book value", "C. Residual value", "D. Replacement cost"]', 'B', 'Reducing balance applies the rate to the net book value (carrying amount) each year.', 'medium', 1, 33),

('q_acc_2024_034', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Provision for bad debts is:', 'multiple_choice', '["A. A liability", "B. An expense", "C. A contra asset", "D. Revenue"]', 'C', 'Provision for bad debts is a contra asset that reduces trade receivables.', 'medium', 1, 34),

('q_acc_2024_035', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'When a bad debt is written off:', 'multiple_choice', '["A. Debit Cash, Credit Debtor", "B. Debit Bad Debts, Credit Debtor", "C. Debit Debtor, Credit Bad Debts", "D. Debit Provision, Credit Cash"]', 'B', 'To write off a bad debt: Debit Bad Debts expense, Credit the Debtor''s account.', 'medium', 1, 35),

('q_acc_2024_036', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Net book value of an asset equals:', 'multiple_choice', '["A. Cost + Depreciation", "B. Cost - Accumulated depreciation", "C. Depreciation - Residual value", "D. Market value"]', 'B', 'Net Book Value = Cost - Accumulated Depreciation.', 'easy', 1, 36),

('q_acc_2024_037', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'An increase in provision for bad debts is:', 'multiple_choice', '["A. Credited to P&L", "B. Debited to P&L", "C. Added to assets", "D. Added to capital"]', 'B', 'An increase in provision for bad debts is an expense (debited to Profit & Loss).', 'medium', 1, 37),

('q_acc_2024_038', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Recovery of bad debt previously written off requires:', 'multiple_choice', '["A. Debit Debtor, Credit Bad Debts Recovered; then Debit Cash, Credit Debtor", "B. Debit Cash, Credit Bad Debts only", "C. Debit Provision, Credit Cash", "D. No entry needed"]', 'A', 'First reinstate the debtor, then record the cash received.', 'hard', 1, 38),

('q_acc_2024_039', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Disposal of fixed asset at a profit means:', 'multiple_choice', '["A. Sale proceeds < NBV", "B. Sale proceeds > NBV", "C. Sale proceeds = Cost", "D. No depreciation"]', 'B', 'Profit on disposal occurs when sale proceeds exceed the net book value.', 'medium', 1, 39),

('q_acc_2024_040', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Accumulated depreciation is shown in the balance sheet as:', 'multiple_choice', '["A. A current asset", "B. Deducted from fixed asset cost", "C. A current liability", "D. Added to capital"]', 'B', 'Accumulated depreciation is shown as a deduction from the fixed asset cost.', 'easy', 1, 40),

-- Bank Reconciliation and Control Accounts (Q41-50)
('q_acc_2024_041', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Bank reconciliation is prepared to:', 'multiple_choice', '["A. Find the bank balance", "B. Reconcile differences between cash book and bank statement", "C. Record deposits", "D. Calculate interest"]', 'B', 'Bank reconciliation explains differences between the cash book balance and bank statement balance.', 'easy', 1, 41),

('q_acc_2024_042', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Unpresented cheques are:', 'multiple_choice', '["A. Added to bank statement balance", "B. Deducted from bank statement balance", "C. Added to cash book balance", "D. Ignored"]', 'B', 'Unpresented (outstanding) cheques are deducted from the bank statement balance.', 'medium', 1, 42),

('q_acc_2024_043', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Uncredited deposits (deposits in transit) are:', 'multiple_choice', '["A. Deducted from bank statement", "B. Added to bank statement balance", "C. Deducted from cash book", "D. Already in bank statement"]', 'B', 'Deposits in transit are added to the bank statement balance (already in cash book but not yet credited by bank).', 'medium', 1, 43),

('q_acc_2024_044', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'A direct credit on bank statement but not in cash book requires:', 'multiple_choice', '["A. Debit Cash Book, Credit Bank", "B. Debit Bank column of Cash Book", "C. Credit Bank column of Cash Book", "D. No entry"]', 'B', 'Direct credits (like standing orders in) need to be recorded by debiting the bank column in cash book.', 'hard', 1, 44),

('q_acc_2024_045', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'The purpose of a control account is to:', 'multiple_choice', '["A. Record transactions", "B. Verify accuracy of subsidiary ledgers", "C. Calculate profit", "D. Prepare trial balance"]', 'B', 'Control accounts verify the accuracy of totals in subsidiary ledgers.', 'medium', 1, 45),

('q_acc_2024_046', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Sales ledger control account is debited with:', 'multiple_choice', '["A. Cash received from debtors", "B. Credit sales", "C. Discount allowed", "D. Bad debts"]', 'B', 'Credit sales increase debtors, so the sales ledger control account is debited.', 'medium', 1, 46),

('q_acc_2024_047', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Purchases ledger control account is credited with:', 'multiple_choice', '["A. Cash paid to creditors", "B. Returns outwards", "C. Credit purchases", "D. Discount received"]', 'C', 'Credit purchases increase creditors, so the purchases ledger control account is credited.', 'medium', 1, 47),

('q_acc_2024_048', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Contras (set-offs) appear on:', 'multiple_choice', '["A. Credit side of sales ledger control only", "B. Both sales and purchases ledger control accounts", "C. Debit side of purchases ledger control only", "D. Neither account"]', 'B', 'Contra entries appear in both control accounts to cancel mutual debts.', 'hard', 1, 48),

('q_acc_2024_049', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'Bank charges appearing on bank statement must be:', 'multiple_choice', '["A. Added to cash book bank column", "B. Credited in cash book bank column", "C. Added to bank statement balance", "D. Ignored"]', 'B', 'Bank charges reduce the bank balance, so credit the bank column of the cash book.', 'medium', 1, 49),

('q_acc_2024_050', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2024_1', 'A dishonoured cheque from a customer is:', 'multiple_choice', '["A. Debited to customer account", "B. Credited to customer account", "C. Debited to bank charges", "D. Credited to sales"]', 'A', 'A dishonoured cheque reinstates the debt, so debit the customer''s account.', 'medium', 1, 50),

-- Financial Accounting 2023 Questions - Basic Concepts (Q1-10)
('q_acc_2023_001', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Assets are resources:', 'multiple_choice', '["A. Owed by the business", "B. Owned by the business", "C. Only in cash form", "D. Belonging to creditors"]', 'B', 'Assets are resources owned by the business that have future economic benefits.', 'easy', 1, 1),

('q_acc_2023_002', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Liabilities represent:', 'multiple_choice', '["A. What the business owns", "B. What the business owes", "C. Business profits", "D. Owner''s investment"]', 'B', 'Liabilities are obligations or amounts owed by the business to others.', 'easy', 1, 2),

('q_acc_2023_003', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Capital represents:', 'multiple_choice', '["A. Business debts", "B. Owner''s claim on business assets", "C. Money in the bank", "D. Profit only"]', 'B', 'Capital (owner''s equity) represents the owner''s claim on the net assets of the business.', 'easy', 1, 3),

('q_acc_2023_004', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'The business entity concept states that:', 'multiple_choice', '["A. Business and owner are the same", "B. Business is separate from its owner", "C. Only limited companies are separate", "D. Personal expenses are business expenses"]', 'B', 'The entity concept treats the business as separate from its owner(s).', 'medium', 1, 4),

('q_acc_2023_005', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Drawings represent:', 'multiple_choice', '["A. Business expenses", "B. Owner''s withdrawals from business", "C. Money received", "D. Additional investment"]', 'B', 'Drawings are assets (usually cash or goods) withdrawn by the owner for personal use.', 'easy', 1, 5),

('q_acc_2023_006', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Which of these is a fixed asset?', 'multiple_choice', '["A. Cash", "B. Debtors", "C. Machinery", "D. Stock"]', 'C', 'Machinery is a fixed asset held for long-term use in the business.', 'easy', 1, 6),

('q_acc_2023_007', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Revenue expenditure is:', 'multiple_choice', '["A. Expenditure on fixed assets", "B. Day-to-day running expenses", "C. Capital investment", "D. Long-term investment"]', 'B', 'Revenue expenditure covers day-to-day expenses that benefit the current period only.', 'medium', 1, 7),

('q_acc_2023_008', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Capital expenditure includes:', 'multiple_choice', '["A. Wages", "B. Purchase of fixed assets", "C. Rent", "D. Electricity"]', 'B', 'Capital expenditure is spending on acquiring or improving fixed assets.', 'easy', 1, 8),

('q_acc_2023_009', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'The prudence concept requires:', 'multiple_choice', '["A. Anticipating profits", "B. Not anticipating profits, providing for losses", "C. Ignoring losses", "D. Recording only cash transactions"]', 'B', 'Prudence requires not recognizing profits until realized but providing for anticipated losses.', 'medium', 1, 9),

('q_acc_2023_010', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'The consistency concept requires:', 'multiple_choice', '["A. Changing methods yearly", "B. Using same methods from period to period", "C. Different methods for different assets", "D. No depreciation"]', 'B', 'Consistency requires using the same accounting methods from one period to another.', 'medium', 1, 10),

-- Recording Transactions (Q11-20)
('q_acc_2023_011', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A credit entry records:', 'multiple_choice', '["A. Increase in assets", "B. Decrease in liabilities", "C. Increase in liabilities or income", "D. Decrease in income"]', 'C', 'Credits record increases in liabilities, income, and capital, and decreases in assets and expenses.', 'medium', 1, 11),

('q_acc_2023_012', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A debit entry records:', 'multiple_choice', '["A. Increase in liabilities", "B. Decrease in assets", "C. Increase in assets or expenses", "D. Increase in capital"]', 'C', 'Debits record increases in assets and expenses, and decreases in liabilities, income, and capital.', 'medium', 1, 12),

('q_acc_2023_013', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Purchase of goods on credit is recorded as:', 'multiple_choice', '["A. Debit Purchases, Credit Cash", "B. Debit Purchases, Credit Supplier", "C. Debit Supplier, Credit Purchases", "D. Debit Cash, Credit Supplier"]', 'B', 'Credit purchase: Debit Purchases (expense increases), Credit Supplier/Creditor (liability increases).', 'medium', 1, 13),

('q_acc_2023_014', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Cash received from a debtor is:', 'multiple_choice', '["A. Debit Debtor, Credit Cash", "B. Debit Cash, Credit Debtor", "C. Debit Cash, Credit Sales", "D. Debit Sales, Credit Cash"]', 'B', 'Cash received from debtor: Debit Cash (asset increases), Credit Debtor (asset decreases).', 'easy', 1, 14),

('q_acc_2023_015', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Payment of rent is recorded as:', 'multiple_choice', '["A. Debit Cash, Credit Rent", "B. Debit Rent, Credit Cash", "C. Debit Landlord, Credit Cash", "D. Debit Cash, Credit Landlord"]', 'B', 'Payment of rent: Debit Rent expense, Credit Cash/Bank.', 'easy', 1, 15),

('q_acc_2023_016', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'The purchases day book records:', 'multiple_choice', '["A. Cash purchases", "B. Credit purchases of goods", "C. All purchases", "D. Fixed asset purchases"]', 'B', 'The purchases day book (purchases journal) records credit purchases of goods only.', 'easy', 1, 16),

('q_acc_2023_017', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Returns inwards journal records:', 'multiple_choice', '["A. Goods returned by the business", "B. Goods returned by customers", "C. Damaged goods", "D. Stock losses"]', 'B', 'Returns inwards (sales returns) journal records goods returned by customers.', 'easy', 1, 17),

('q_acc_2023_018', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'The balance on a debtor''s account shows:', 'multiple_choice', '["A. Amount we owe them", "B. Amount they owe us", "C. Total sales", "D. Total receipts"]', 'B', 'A debtor''s balance represents the amount the customer owes the business.', 'easy', 1, 18),

('q_acc_2023_019', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Discounts allowed are given to:', 'multiple_choice', '["A. Suppliers", "B. Customers", "C. Employees", "D. Banks"]', 'B', 'Discounts allowed are given to customers for early payment.', 'easy', 1, 19),

('q_acc_2023_020', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Cash discount differs from trade discount because it is:', 'multiple_choice', '["A. Larger", "B. Recorded in the books", "C. Given on purchases only", "D. Fixed by law"]', 'B', 'Cash discount is recorded in the books; trade discount is deducted before recording.', 'medium', 1, 20),

-- Trial Balance and Errors (Q21-30)
('q_acc_2023_021', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A trial balance that balances proves:', 'multiple_choice', '["A. All entries are correct", "B. Equal debits and credits were recorded", "C. No errors exist", "D. Profit was made"]', 'B', 'A balanced trial balance only proves that total debits equal total credits, not that all entries are correct.', 'medium', 1, 21),

('q_acc_2023_022', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Which error will NOT affect trial balance agreement?', 'multiple_choice', '["A. Addition error", "B. Error of commission", "C. Posting to wrong side", "D. Omitting one entry"]', 'B', 'Error of commission (wrong account of same class) doesn''t affect trial balance totals.', 'medium', 1, 22),

('q_acc_2023_023', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Error of omission occurs when:', 'multiple_choice', '["A. Wrong amount recorded", "B. Transaction completely left out", "C. Entry on wrong side", "D. Wrong account used"]', 'B', 'Error of omission is when a transaction is completely not recorded.', 'easy', 1, 23),

('q_acc_2023_024', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Error of principle occurs when:', 'multiple_choice', '["A. Wrong amount recorded", "B. Item recorded in wrong class of account", "C. Entry omitted", "D. Figures transposed"]', 'B', 'Error of principle is posting to wrong type of account (e.g., expense to asset).', 'medium', 1, 24),

('q_acc_2023_025', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Compensating errors:', 'multiple_choice', '["A. Can never occur", "B. Cancel each other out", "C. Always affect trial balance", "D. Only occur in journals"]', 'B', 'Compensating errors are two or more errors that cancel each other out.', 'medium', 1, 25),

('q_acc_2023_026', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A suspense account is used to:', 'multiple_choice', '["A. Calculate profit", "B. Temporarily balance the trial balance", "C. Record capital", "D. Store assets"]', 'B', 'A suspense account temporarily holds the difference while errors are investigated.', 'medium', 1, 26),

('q_acc_2023_027', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Error of original entry means:', 'multiple_choice', '["A. Entry omitted", "B. Correct accounts but wrong amount in both", "C. Wrong account used", "D. Entry duplicated"]', 'B', 'Error of original entry is when the wrong amount is recorded in both accounts.', 'medium', 1, 27),

('q_acc_2023_028', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A transposition error involves:', 'multiple_choice', '["A. Omitting digits", "B. Reversing order of digits", "C. Adding extra digits", "D. Using wrong account"]', 'B', 'A transposition error reverses the order of digits (e.g., 53 instead of 35).', 'easy', 1, 28),

('q_acc_2023_029', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Which appears in the trial balance?', 'multiple_choice', '["A. Gross profit", "B. Net profit", "C. Purchases", "D. Cost of goods sold"]', 'C', 'Purchases appears in the trial balance; gross profit, net profit, and COGS are calculated later.', 'medium', 1, 29),

('q_acc_2023_030', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A debit balance on the capital account indicates:', 'multiple_choice', '["A. Profit", "B. Net assets exceed liabilities", "C. Drawings exceed capital + profit", "D. Business is successful"]', 'C', 'A debit capital balance means drawings exceed capital invested plus accumulated profits.', 'hard', 1, 30),

-- Final Accounts and Adjustments (Q31-40)
('q_acc_2023_031', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Returns outwards is deducted from:', 'multiple_choice', '["A. Sales", "B. Purchases", "C. Gross profit", "D. Net profit"]', 'B', 'Returns outwards (purchase returns) is deducted from purchases.', 'easy', 1, 31),

('q_acc_2023_032', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Income received in advance is:', 'multiple_choice', '["A. A current asset", "B. A current liability", "C. An expense", "D. Capital"]', 'B', 'Income received in advance is a liability (obligation to provide service).', 'medium', 1, 32),

('q_acc_2023_033', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Accrued income is:', 'multiple_choice', '["A. Income received but not earned", "B. Income earned but not yet received", "C. An expense", "D. A liability"]', 'B', 'Accrued income is revenue earned but not yet received at the end of the period.', 'medium', 1, 33),

('q_acc_2023_034', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Goods taken by owner for personal use are:', 'multiple_choice', '["A. Credited to purchases", "B. Debited to drawings", "C. Credited to sales", "D. Both B and C"]', 'D', 'Goods taken by owner: Debit Drawings, Credit Purchases (at cost) or Credit Sales (at selling price for some methods).', 'hard', 1, 34),

('q_acc_2023_035', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'The balance sheet shows:', 'multiple_choice', '["A. Profit for the year", "B. Assets, liabilities and capital at a point in time", "C. Cash flow", "D. Sales and purchases"]', 'B', 'The balance sheet shows the financial position at a specific point in time.', 'easy', 1, 35),

('q_acc_2023_036', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Goodwill is:', 'multiple_choice', '["A. A tangible asset", "B. An intangible asset", "C. A liability", "D. An expense"]', 'B', 'Goodwill is an intangible asset representing the value of reputation and customer relationships.', 'easy', 1, 36),

('q_acc_2023_037', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Stock is valued at:', 'multiple_choice', '["A. Cost only", "B. Market value only", "C. Lower of cost or net realizable value", "D. Higher of cost or market value"]', 'C', 'Stock is valued at the lower of cost or net realizable value (prudence).', 'medium', 1, 37),

('q_acc_2023_038', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A sole trader''s capital account balance represents:', 'multiple_choice', '["A. Profit only", "B. Cash in bank", "C. Owner''s equity in the business", "D. Total assets"]', 'C', 'Capital represents the owner''s claim on the net assets of the business.', 'easy', 1, 38),

('q_acc_2023_039', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Interest on capital is:', 'multiple_choice', '["A. An expense in P&L", "B. Added to capital", "C. A liability", "D. An asset"]', 'A', 'Interest on capital is an expense in the profit and loss account and added to capital.', 'medium', 1, 39),

('q_acc_2023_040', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Goods destroyed by fire with no insurance is:', 'multiple_choice', '["A. A normal expense", "B. An abnormal loss debited to P&L", "C. Not recorded", "D. Added to purchases"]', 'B', 'Uninsured loss from fire is an abnormal loss charged to the profit and loss account.', 'medium', 1, 40),

-- Specialized Areas (Q41-50)
('q_acc_2023_041', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A manufacturing account calculates:', 'multiple_choice', '["A. Gross profit", "B. Cost of production", "C. Net profit", "D. Sales revenue"]', 'B', 'The manufacturing account calculates the cost of goods manufactured.', 'medium', 1, 41),

('q_acc_2023_042', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Prime cost consists of:', 'multiple_choice', '["A. Direct materials + Direct labor", "B. All factory costs", "C. Administrative costs", "D. Selling costs"]', 'A', 'Prime cost = Direct Materials + Direct Labor + Direct Expenses.', 'medium', 1, 42),

('q_acc_2023_043', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Factory overheads include:', 'multiple_choice', '["A. Direct wages", "B. Raw materials", "C. Factory rent and power", "D. Sales commission"]', 'C', 'Factory overheads are indirect manufacturing costs like factory rent, power, and supervision.', 'medium', 1, 43),

('q_acc_2023_044', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Work-in-progress represents:', 'multiple_choice', '["A. Finished goods", "B. Partially completed goods", "C. Raw materials", "D. Goods in transit"]', 'B', 'Work-in-progress consists of partially completed goods at the end of a period.', 'easy', 1, 44),

('q_acc_2023_045', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'In a partnership, profit is distributed according to:', 'multiple_choice', '["A. Capital ratios only", "B. Partnership agreement", "C. Equally always", "D. Number of partners"]', 'B', 'Profits are distributed according to the partnership agreement (or equally if no agreement).', 'easy', 1, 45),

('q_acc_2023_046', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Appropriation account shows:', 'multiple_choice', '["A. How profit is calculated", "B. How profit is distributed", "C. All expenses", "D. All income"]', 'B', 'The appropriation account shows how profit is distributed among partners.', 'easy', 1, 46),

('q_acc_2023_047', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'A partner''s current account shows:', 'multiple_choice', '["A. Fixed capital", "B. Share of profits, drawings, and salaries", "C. Total investment", "D. Loan to partnership"]', 'B', 'The current account records profit shares, drawings, salaries, and interest.', 'medium', 1, 47),

('q_acc_2023_048', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'In a not-for-profit organization, the equivalent of profit is:', 'multiple_choice', '["A. Revenue", "B. Surplus", "C. Income", "D. Dividend"]', 'B', 'Non-profit organizations refer to excess of income over expenditure as surplus (not profit).', 'easy', 1, 48),

('q_acc_2023_049', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'Subscriptions received in advance are:', 'multiple_choice', '["A. Income", "B. A liability", "C. An asset", "D. Capital"]', 'B', 'Subscriptions received in advance are a liability (obligation to provide service).', 'medium', 1, 49),

('q_acc_2023_050', 'subj_wassce_accounting', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_acc_2023_1', 'The receipts and payments account is:', 'multiple_choice', '["A. An income statement", "B. A cash summary", "C. A balance sheet", "D. A bank reconciliation"]', 'B', 'The receipts and payments account is a summary of cash and bank transactions.', 'easy', 1, 50);
