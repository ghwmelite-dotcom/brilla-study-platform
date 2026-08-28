# Cambridge content reconciliation flight

Run each SQL file as a separate D1 file execution in this exact order, stopping on the first failure:

1. `00_preflight.sql`
2. `01_initialize_backup.sql`
3. `02_reconcile_alevel_math_part_1.sql`
4. `03_reconcile_alevel_math_part_2.sql`
5. `04_reconcile_alevel_math_part_3.sql`
6. `05_reconcile_alevel_math_part_4.sql`
7. `06_reconcile_alevel_math_part_5.sql`
8. `07_reconcile_alevel_math_part_6.sql`
9. `08_reconcile_alevel_math_part_7.sql`
10. `09_reconcile_alevel_math_part_8.sql`
11. `10_reconcile_alevel_math_part_9.sql`
12. `11_reconcile_alevel_math_part_10.sql`
13. `12_reconcile_alevel_math_part_11.sql`
14. `13_reconcile_alevel_math_part_12.sql`
15. `14_reconcile_alevel_math_part_13.sql`
16. `15_reconcile_alevel_math_part_14.sql`
17. `16_reconcile_alevel_math_part_15.sql`
18. `17_reconcile_alevel_math_part_16.sql`
19. `18_reconcile_alevel_math_part_17.sql`
20. `19_reconcile_alevel_math_part_18.sql`
21. `20_reconcile_alevel_math_part_19.sql`
22. `21_reconcile_alevel_math_part_20.sql`
23. `22_reconcile_alevel_math_part_21.sql`
24. `23_reconcile_alevel_math_part_22.sql`
25. `24_reconcile_alevel_math_part_23.sql`
26. `25_reconcile_alevel_math_part_24.sql`
27. `26_reconcile_alevel_math_part_25.sql`
28. `27_reconcile_alevel_math_part_26.sql`
29. `28_reconcile_alevel_math_part_27.sql`
30. `29_reconcile_alevel_math_part_28.sql`
31. `30_reconcile_alevel_math_part_29.sql`
32. `31_reconcile_alevel_math_part_30.sql`
33. `32_reconcile_alevel_math_part_31.sql`
34. `33_reconcile_alevel_math_part_32.sql`
35. `34_reconcile_alevel_math_part_33.sql`
36. `35_reconcile_alevel_math_part_34.sql`
37. `36_reconcile_alevel_math_part_35.sql`
38. `37_reconcile_alevel_math_part_36.sql`
39. `38_reconcile_alevel_math_part_37.sql`
40. `39_reconcile_alevel_math_part_38.sql`
41. `40_reconcile_alevel_math_part_39.sql`
42. `41_reconcile_alevel_math_part_40.sql`
43. `42_reconcile_igcse_biology_part_41.sql`
44. `43_reconcile_igcse_biology_part_42.sql`
45. `44_reconcile_igcse_biology_part_43.sql`
46. `45_reconcile_igcse_biology_part_44.sql`
47. `46_reconcile_igcse_biology_part_45.sql`
48. `47_reconcile_igcse_biology_part_46.sql`
49. `48_reconcile_igcse_biology_part_47.sql`
50. `49_reconcile_igcse_biology_part_48.sql`
51. `50_reconcile_igcse_biology_part_49.sql`
52. `51_reconcile_igcse_biology_part_50.sql`
53. `52_reconcile_igcse_biology_part_51.sql`
54. `53_reconcile_igcse_chemistry_part_52.sql`
55. `54_reconcile_igcse_chemistry_part_53.sql`
56. `55_reconcile_igcse_chemistry_part_54.sql`
57. `56_reconcile_igcse_chemistry_part_55.sql`
58. `57_reconcile_igcse_chemistry_part_56.sql`
59. `58_reconcile_igcse_chemistry_part_57.sql`
60. `59_reconcile_igcse_chemistry_part_58.sql`
61. `60_reconcile_igcse_chemistry_part_59.sql`
62. `61_reconcile_igcse_chemistry_part_60.sql`
63. `62_reconcile_igcse_chemistry_part_61.sql`
64. `63_reconcile_igcse_chemistry_part_62.sql`
65. `64_reconcile_igcse_math_part_63.sql`
66. `65_reconcile_igcse_math_part_64.sql`
67. `66_reconcile_igcse_math_part_65.sql`
68. `67_reconcile_igcse_math_part_66.sql`
69. `68_reconcile_igcse_math_part_67.sql`
70. `69_reconcile_igcse_physics_part_68.sql`
71. `70_reconcile_igcse_physics_part_69.sql`
72. `71_reconcile_igcse_physics_part_70.sql`
73. `72_reconcile_igcse_physics_part_71.sql`
74. `73_reconcile_igcse_physics_part_72.sql`
75. `74_reconcile_igcse_physics_part_73.sql`
76. `75_reconcile_igcse_physics_part_74.sql`
77. `76_reconcile_igcse_physics_part_75.sql`
78. `77_reconcile_igcse_physics_part_76.sql`
79. `90_postflight.sql`

Then run this reconciliation postflight, followed by the unchanged canonical migrations and flights 271-282 in exact numeric order. Do not run `99_cleanup_after_release.sql` as part of this flight; the retained 144-row backup is removed only under a separate explicit authorization.

Recovery: fix the cause, confirm the prior file was atomically rolled back, and replay that same file. To reverse a completed/partial reconciliation, run files in `rollback/` in their numbered order. Stop on the first failure. The backup remains retained.
