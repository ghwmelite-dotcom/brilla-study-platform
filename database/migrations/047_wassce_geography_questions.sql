-- Migration 047: WASSCE Geography Questions
-- 100 questions for 2024 and 2023 Paper 1 (Objectives)

-- First, add the past paper entries for Geography
INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_geo_2024_1', 'exam_wassce', 'subj_wassce_geography', 'paper_wassce_1', 2024, 'May-June', 50, 50, 60, 1);

INSERT OR IGNORE INTO past_papers (id, exam_type_id, subject_id, paper_type_id, year, month, total_questions, total_marks, time_allowed, is_complete)
VALUES ('pp_wassce_geo_2023_1', 'exam_wassce', 'subj_wassce_geography', 'paper_wassce_1', 2023, 'May-June', 50, 50, 60, 1);

-- Geography Questions for 2024 Paper 1
INSERT OR REPLACE INTO questions (id, subject_id, exam_type_id, paper_type_id, past_paper_id, question_text, question_type, options, correct_answer, explanation, difficulty, marks, question_number) VALUES

-- Physical Geography: Earth Structure and Processes (Q1-10)
('q_geo_2024_001', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The innermost layer of the earth is called the:', 'multiple_choice', '["A. Crust", "B. Mantle", "C. Core", "D. Lithosphere"]', 'C', 'The earth consists of three main layers: crust (outer), mantle (middle), and core (innermost).', 'easy', 1, 1),

('q_geo_2024_002', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Rocks formed from cooling and solidification of molten magma are called:', 'multiple_choice', '["A. Sedimentary rocks", "B. Igneous rocks", "C. Metamorphic rocks", "D. Organic rocks"]', 'B', 'Igneous rocks form when molten magma cools and solidifies. Examples include granite and basalt.', 'easy', 1, 2),

('q_geo_2024_003', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Which of the following is an example of a fold mountain?', 'multiple_choice', '["A. Mount Kilimanjaro", "B. The Himalayas", "C. Mount Cameroon", "D. Mount Kenya"]', 'B', 'The Himalayas were formed by the collision of the Indian and Eurasian tectonic plates, creating fold mountains.', 'medium', 1, 3),

('q_geo_2024_004', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'An earthquake''s point of origin beneath the earth''s surface is called the:', 'multiple_choice', '["A. Epicenter", "B. Focus", "C. Fault line", "D. Seismic zone"]', 'B', 'The focus (hypocenter) is the point of origin of an earthquake beneath the surface. The epicenter is directly above it on the surface.', 'medium', 1, 4),

('q_geo_2024_005', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The process by which rocks are broken down in situ is called:', 'multiple_choice', '["A. Erosion", "B. Weathering", "C. Deposition", "D. Transportation"]', 'B', 'Weathering is the breaking down of rocks in place without movement. Erosion involves movement of materials.', 'easy', 1, 5),

('q_geo_2024_006', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Which type of weathering is caused by temperature changes?', 'multiple_choice', '["A. Chemical weathering", "B. Biological weathering", "C. Physical weathering", "D. Organic weathering"]', 'C', 'Physical (mechanical) weathering includes processes like freeze-thaw and exfoliation caused by temperature changes.', 'easy', 1, 6),

('q_geo_2024_007', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'A landform created by river deposition at its mouth is called:', 'multiple_choice', '["A. Gorge", "B. Waterfall", "C. Delta", "D. Meander"]', 'C', 'A delta forms when a river deposits sediments at its mouth as it enters a sea or lake.', 'easy', 1, 7),

('q_geo_2024_008', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The layer of the atmosphere where weather occurs is the:', 'multiple_choice', '["A. Stratosphere", "B. Mesosphere", "C. Troposphere", "D. Thermosphere"]', 'C', 'The troposphere is the lowest layer of the atmosphere where all weather phenomena occur.', 'easy', 1, 8),

('q_geo_2024_009', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Limestone caves are formed mainly by:', 'multiple_choice', '["A. Wind erosion", "B. Chemical weathering", "C. River erosion", "D. Glacial erosion"]', 'B', 'Limestone caves form through chemical weathering when acidic rainwater dissolves the calcium carbonate in limestone.', 'medium', 1, 9),

('q_geo_2024_010', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Tectonic plates float on a semi-molten layer called the:', 'multiple_choice', '["A. Lithosphere", "B. Asthenosphere", "C. Mesosphere", "D. Core"]', 'B', 'The asthenosphere is the semi-molten layer of the upper mantle on which tectonic plates float and move.', 'medium', 1, 10),

-- Climate and Weather (Q11-20)
('q_geo_2024_011', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The instrument used to measure atmospheric pressure is:', 'multiple_choice', '["A. Thermometer", "B. Barometer", "C. Hygrometer", "D. Anemometer"]', 'B', 'A barometer measures atmospheric pressure. Mercury and aneroid barometers are common types.', 'easy', 1, 11),

('q_geo_2024_012', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Rainfall that occurs when moist air is forced to rise over a mountain is:', 'multiple_choice', '["A. Convectional rainfall", "B. Frontal rainfall", "C. Relief rainfall", "D. Cyclonic rainfall"]', 'C', 'Relief (orographic) rainfall occurs when moist air rises over a barrier like a mountain and cools.', 'medium', 1, 12),

('q_geo_2024_013', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The Harmattan wind blows from the:', 'multiple_choice', '["A. Atlantic Ocean", "B. Sahara Desert", "C. Mediterranean Sea", "D. Indian Ocean"]', 'B', 'The Harmattan is a dry, dusty wind that blows from the Sahara Desert towards West Africa during winter months.', 'easy', 1, 13),

('q_geo_2024_014', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The imaginary line at 23.5°N is called the:', 'multiple_choice', '["A. Equator", "B. Tropic of Cancer", "C. Tropic of Capricorn", "D. Arctic Circle"]', 'B', 'The Tropic of Cancer at 23.5°N marks the northernmost latitude where the sun can be directly overhead.', 'easy', 1, 14),

('q_geo_2024_015', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Climate is best described as:', 'multiple_choice', '["A. Daily atmospheric conditions", "B. Average weather conditions over a long period", "C. Monthly temperature changes", "D. Seasonal rainfall patterns"]', 'B', 'Climate refers to the average weather conditions of a place measured over 30 or more years.', 'easy', 1, 15),

('q_geo_2024_016', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The greenhouse effect is caused mainly by:', 'multiple_choice', '["A. Oxygen in the atmosphere", "B. Carbon dioxide and other gases", "C. Nitrogen in the air", "D. Water in the oceans"]', 'B', 'Greenhouse gases like CO2, methane, and water vapor trap heat in the atmosphere, causing global warming.', 'medium', 1, 16),

('q_geo_2024_017', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Humidity is measured using a:', 'multiple_choice', '["A. Rain gauge", "B. Wind vane", "C. Hygrometer", "D. Thermometer"]', 'C', 'A hygrometer measures the amount of water vapor (humidity) in the air.', 'easy', 1, 17),

('q_geo_2024_018', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The equatorial climate is characterized by:', 'multiple_choice', '["A. Low rainfall throughout the year", "B. Hot and wet conditions all year", "C. Distinct wet and dry seasons", "D. Cool summers and cold winters"]', 'B', 'Equatorial climate has high temperatures and heavy rainfall throughout the year with no dry season.', 'easy', 1, 18),

('q_geo_2024_019', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Sea breezes blow from the:', 'multiple_choice', '["A. Land to sea during the day", "B. Sea to land during the day", "C. Sea to land at night", "D. Land to sea at all times"]', 'B', 'Sea breezes blow from sea to land during the day because land heats up faster than water.', 'medium', 1, 19),

('q_geo_2024_020', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The ozone layer protects the earth from:', 'multiple_choice', '["A. Infrared radiation", "B. Ultraviolet radiation", "C. Radio waves", "D. Visible light"]', 'B', 'The ozone layer in the stratosphere absorbs most of the sun''s harmful ultraviolet (UV) radiation.', 'easy', 1, 20),

-- Map Reading and Interpretation (Q21-30)
('q_geo_2024_021', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Contour lines that are close together on a map indicate:', 'multiple_choice', '["A. Gentle slope", "B. Steep slope", "C. Flat land", "D. Valley floor"]', 'B', 'Closely spaced contour lines indicate a steep slope, while widely spaced lines show gentle slopes.', 'easy', 1, 21),

('q_geo_2024_022', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The scale of a map is 1:50,000. What is the actual distance if the map distance is 4cm?', 'multiple_choice', '["A. 1 km", "B. 2 km", "C. 3 km", "D. 4 km"]', 'B', 'At 1:50,000 scale, 1cm = 500m. So 4cm = 4 × 500m = 2,000m = 2km.', 'medium', 1, 22),

('q_geo_2024_023', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Lines joining places of equal height above sea level are called:', 'multiple_choice', '["A. Isobars", "B. Contour lines", "C. Isotherms", "D. Isohyets"]', 'B', 'Contour lines join points of equal elevation above sea level.', 'easy', 1, 23),

('q_geo_2024_024', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The bearing of North is:', 'multiple_choice', '["A. 000° or 360°", "B. 090°", "C. 180°", "D. 270°"]', 'A', 'North has a bearing of 000° or 360°. East is 090°, South is 180°, and West is 270°.', 'easy', 1, 24),

('q_geo_2024_025', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'A map with a scale of 1:25,000 is:', 'multiple_choice', '["A. Smaller scale than 1:50,000", "B. Larger scale than 1:50,000", "C. Same scale as 1:50,000", "D. Cannot be compared"]', 'B', 'A smaller denominator (25,000 vs 50,000) means a larger scale showing more detail.', 'medium', 1, 25),

('q_geo_2024_026', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Latitude is measured from the:', 'multiple_choice', '["A. Prime Meridian", "B. International Date Line", "C. Equator", "D. Tropic of Cancer"]', 'C', 'Latitude is the angular distance measured north or south from the Equator (0°) to the poles (90°).', 'easy', 1, 26),

('q_geo_2024_027', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The Prime Meridian passes through:', 'multiple_choice', '["A. Paris, France", "B. Washington D.C., USA", "C. Greenwich, England", "D. Tokyo, Japan"]', 'C', 'The Prime Meridian (0° longitude) passes through Greenwich, England.', 'easy', 1, 27),

('q_geo_2024_028', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'A relief map shows:', 'multiple_choice', '["A. Political boundaries", "B. Roads and railways", "C. Physical features of the land", "D. Population distribution"]', 'C', 'A relief map shows the physical features and topography of an area including mountains, valleys, and plains.', 'easy', 1, 28),

('q_geo_2024_029', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Grid references are used to:', 'multiple_choice', '["A. Measure distances", "B. Locate places on a map", "C. Show elevation", "D. Indicate climate zones"]', 'B', 'Grid references use eastings and northings to precisely locate any point on a map.', 'easy', 1, 29),

('q_geo_2024_030', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'V-shaped contours pointing upstream indicate a:', 'multiple_choice', '["A. Spur", "B. Valley", "C. Ridge", "D. Plateau"]', 'B', 'V-shaped contours pointing upstream (towards higher ground) indicate a river valley.', 'medium', 1, 30),

-- Human Geography: Population and Settlement (Q31-40)
('q_geo_2024_031', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The movement of people from rural to urban areas is called:', 'multiple_choice', '["A. Immigration", "B. Emigration", "C. Rural-urban migration", "D. International migration"]', 'C', 'Rural-urban migration is the movement of people from countryside to cities, often in search of better opportunities.', 'easy', 1, 31),

('q_geo_2024_032', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Population density is calculated by:', 'multiple_choice', '["A. Total population ÷ Total area", "B. Total area ÷ Total population", "C. Birth rate - Death rate", "D. Immigration - Emigration"]', 'A', 'Population density = Total population divided by total area, usually expressed as persons per square kilometer.', 'easy', 1, 32),

('q_geo_2024_033', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'A nucleated settlement pattern is characterized by:', 'multiple_choice', '["A. Scattered houses", "B. Houses built along a road", "C. Houses clustered together", "D. Houses built along a river"]', 'C', 'Nucleated settlements have buildings clustered together, often around a central point like a market or church.', 'medium', 1, 33),

('q_geo_2024_034', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The natural increase of population is:', 'multiple_choice', '["A. Birth rate plus death rate", "B. Birth rate minus death rate", "C. Immigration plus emigration", "D. Total population growth"]', 'B', 'Natural increase = Birth rate - Death rate. It excludes migration.', 'easy', 1, 34),

('q_geo_2024_035', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'A major push factor for migration is:', 'multiple_choice', '["A. Better job opportunities", "B. Higher wages", "C. Unemployment", "D. Good schools"]', 'C', 'Push factors like unemployment, poverty, and conflict drive people away from an area.', 'easy', 1, 35),

('q_geo_2024_036', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The Central Business District (CBD) of a city is characterized by:', 'multiple_choice', '["A. Low land values", "B. Residential housing", "C. High-rise buildings and offices", "D. Industrial factories"]', 'C', 'The CBD is the commercial heart of a city with high land values, offices, shops, and high-rise buildings.', 'medium', 1, 36),

('q_geo_2024_037', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Urbanization leads to:', 'multiple_choice', '["A. Decreased population in cities", "B. Growth of rural areas", "C. Expansion of urban areas", "D. Reduction in infrastructure"]', 'C', 'Urbanization is the increase in the proportion of people living in urban areas and the expansion of cities.', 'easy', 1, 37),

('q_geo_2024_038', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'A population pyramid with a wide base indicates:', 'multiple_choice', '["A. Aging population", "B. Low birth rate", "C. Young population with high birth rate", "D. Zero population growth"]', 'C', 'A wide base shows a high proportion of young people, typical of developing countries with high birth rates.', 'medium', 1, 38),

('q_geo_2024_039', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Site factors affecting settlement location include:', 'multiple_choice', '["A. Trade routes", "B. Water supply and relief", "C. Government policy", "D. Cultural preferences"]', 'B', 'Site factors are physical characteristics of a location like water supply, relief, soil, and drainage.', 'medium', 1, 39),

('q_geo_2024_040', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Slums are a result of:', 'multiple_choice', '["A. Careful urban planning", "B. Rapid urbanization without adequate housing", "C. Government housing programs", "D. Declining urban population"]', 'B', 'Slums develop when rapid urbanization outpaces housing and infrastructure development.', 'easy', 1, 40),

-- Economic Geography: Agriculture and Industry (Q41-50)
('q_geo_2024_041', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Subsistence farming is characterized by:', 'multiple_choice', '["A. Production for commercial sale", "B. Production mainly for family consumption", "C. Use of modern machinery", "D. Large-scale operations"]', 'B', 'Subsistence farming produces food primarily for the farmer''s family with little or no surplus for sale.', 'easy', 1, 41),

('q_geo_2024_042', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Which of these is a cash crop in West Africa?', 'multiple_choice', '["A. Millet", "B. Cassava", "C. Cocoa", "D. Yam"]', 'C', 'Cocoa is a major cash crop grown for export in West Africa, especially in Ghana and Côte d''Ivoire.', 'easy', 1, 42),

('q_geo_2024_043', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Irrigation is most needed in areas with:', 'multiple_choice', '["A. High rainfall", "B. Low and unreliable rainfall", "C. Equatorial climate", "D. Temperate climate"]', 'B', 'Irrigation is essential in arid and semi-arid regions where rainfall is low and unreliable.', 'easy', 1, 43),

('q_geo_2024_044', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Primary industries are involved in:', 'multiple_choice', '["A. Manufacturing goods", "B. Providing services", "C. Extracting raw materials", "D. Transportation"]', 'C', 'Primary industries extract raw materials from nature, including farming, mining, fishing, and forestry.', 'easy', 1, 44),

('q_geo_2024_045', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Industries locate near raw materials when:', 'multiple_choice', '["A. Raw materials are light", "B. Raw materials are bulky and lose weight in processing", "C. Products are heavier than raw materials", "D. Labor is the main cost"]', 'B', 'Industries processing weight-losing materials (like sugar cane) locate near raw material sources to minimize transport costs.', 'medium', 1, 45),

('q_geo_2024_046', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Shifting cultivation involves:', 'multiple_choice', '["A. Permanent farming on the same land", "B. Moving to new land after soil exhaustion", "C. Using irrigation systems", "D. Intensive use of fertilizers"]', 'B', 'Shifting cultivation involves clearing land, farming until soil fertility declines, then moving to new areas.', 'easy', 1, 46),

('q_geo_2024_047', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Mixed farming combines:', 'multiple_choice', '["A. Cash and food crops only", "B. Crop cultivation and animal rearing", "C. Irrigation and rainfed farming", "D. Traditional and modern methods"]', 'B', 'Mixed farming involves both growing crops and raising livestock on the same farm.', 'easy', 1, 47),

('q_geo_2024_048', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'The Sahel region is characterized by:', 'multiple_choice', '["A. Dense rainforest", "B. Semi-arid grassland", "C. Mangrove swamps", "D. Mediterranean vegetation"]', 'B', 'The Sahel is a semi-arid transition zone between the Sahara Desert and the savannas to the south.', 'medium', 1, 48),

('q_geo_2024_049', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Mineral resources are classified as:', 'multiple_choice', '["A. Renewable resources", "B. Non-renewable resources", "C. Inexhaustible resources", "D. Flow resources"]', 'B', 'Minerals are non-renewable resources because they take millions of years to form and can be exhausted.', 'easy', 1, 49),

('q_geo_2024_050', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2024_1', 'Tourism is classified under which sector of the economy?', 'multiple_choice', '["A. Primary sector", "B. Secondary sector", "C. Tertiary sector", "D. Quaternary sector"]', 'C', 'Tourism is a service industry and belongs to the tertiary (service) sector of the economy.', 'easy', 1, 50),

-- Geography 2023 Questions - Physical Geography (Q1-10)
('q_geo_2023_001', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The breaking of rocks by plant roots is an example of:', 'multiple_choice', '["A. Chemical weathering", "B. Physical weathering", "C. Biological weathering", "D. Mechanical weathering"]', 'C', 'Biological weathering occurs when living organisms like plant roots break down rocks.', 'easy', 1, 1),

('q_geo_2023_002', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'A rift valley is formed by:', 'multiple_choice', '["A. Folding of rocks", "B. Faulting and subsidence", "C. Volcanic activity", "D. Erosion by rivers"]', 'B', 'Rift valleys form when land between two parallel faults subsides due to tensional forces.', 'medium', 1, 2),

('q_geo_2023_003', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Marble is formed from the metamorphism of:', 'multiple_choice', '["A. Granite", "B. Sandstone", "C. Limestone", "D. Shale"]', 'C', 'Marble forms when limestone undergoes metamorphism under heat and pressure.', 'medium', 1, 3),

('q_geo_2023_004', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'An ox-bow lake is formed from:', 'multiple_choice', '["A. Volcanic crater", "B. Cut-off river meander", "C. Glacial depression", "D. Coastal erosion"]', 'B', 'An ox-bow lake forms when a river meander is cut off from the main channel.', 'medium', 1, 4),

('q_geo_2023_005', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The wearing away of the sea bed is called:', 'multiple_choice', '["A. Attrition", "B. Corrasion", "C. Hydraulic action", "D. Abrasion"]', 'D', 'Abrasion is the wearing away of the sea bed by waves carrying sand and pebbles.', 'medium', 1, 5),

('q_geo_2023_006', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Soil creep is a type of:', 'multiple_choice', '["A. Chemical weathering", "B. Mass movement", "C. Water erosion", "D. Wind erosion"]', 'B', 'Soil creep is the slow, downhill movement of soil particles due to gravity.', 'medium', 1, 6),

('q_geo_2023_007', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'A spit is formed by:', 'multiple_choice', '["A. River deposition", "B. Coastal deposition", "C. Glacial erosion", "D. Wind erosion"]', 'B', 'A spit is a narrow ridge of sand or shingle extending from the coast, formed by longshore drift.', 'medium', 1, 7),

('q_geo_2023_008', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The continental crust is made mainly of:', 'multiple_choice', '["A. Basalt", "B. Granite", "C. Iron", "D. Nickel"]', 'B', 'Continental crust is mainly composed of granite (sial - silicon and aluminum).', 'medium', 1, 8),

('q_geo_2023_009', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'A volcanic mountain with a depression at the top is called:', 'multiple_choice', '["A. Cone", "B. Crater", "C. Caldera", "D. Vent"]', 'B', 'A crater is the depression at the top of a volcano formed by eruption or collapse.', 'easy', 1, 9),

('q_geo_2023_010', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Loess is deposited by:', 'multiple_choice', '["A. Rivers", "B. Glaciers", "C. Wind", "D. Sea waves"]', 'C', 'Loess is fine, wind-blown sediment that forms fertile soil when deposited.', 'medium', 1, 10),

-- Climate and Vegetation (Q11-20)
('q_geo_2023_011', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The hottest part of the day is usually around:', 'multiple_choice', '["A. 12 noon", "B. 2 pm", "C. 4 pm", "D. 6 pm"]', 'B', 'Maximum temperature usually occurs around 2 pm due to heat lag - time for ground to heat up and warm the air.', 'medium', 1, 11),

('q_geo_2023_012', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The savanna vegetation is characterized by:', 'multiple_choice', '["A. Dense forest cover", "B. Tall grasses with scattered trees", "C. Evergreen trees", "D. No vegetation"]', 'B', 'Savanna has tall grasses with scattered drought-resistant trees like acacia and baobab.', 'easy', 1, 12),

('q_geo_2023_013', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Fog forms when:', 'multiple_choice', '["A. Air rises rapidly", "B. Air cools below its dew point near the ground", "C. Rain falls heavily", "D. Wind speed increases"]', 'B', 'Fog forms when air near the ground cools below its dew point, causing water vapor to condense.', 'medium', 1, 13),

('q_geo_2023_014', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The trade winds blow from:', 'multiple_choice', '["A. Equator to poles", "B. Subtropical highs to equatorial lows", "C. Poles to equator", "D. West to east"]', 'B', 'Trade winds blow from subtropical high pressure zones towards the equatorial low pressure zone.', 'medium', 1, 14),

('q_geo_2023_015', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Mangrove vegetation is found in:', 'multiple_choice', '["A. Desert regions", "B. Mountain tops", "C. Coastal swamps", "D. Temperate forests"]', 'C', 'Mangroves grow in coastal swamps and tidal areas with salt or brackish water.', 'easy', 1, 15),

('q_geo_2023_016', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Temperature decreases with altitude at a rate of about:', 'multiple_choice', '["A. 1°C per 100m", "B. 6.5°C per 1000m", "C. 10°C per 500m", "D. 2°C per 200m"]', 'B', 'The environmental lapse rate is approximately 6.5°C per 1000m of altitude gain.', 'medium', 1, 16),

('q_geo_2023_017', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Desert vegetation includes:', 'multiple_choice', '["A. Mahogany trees", "B. Cacti and thorn bushes", "C. Tropical rainforest", "D. Coniferous trees"]', 'B', 'Desert plants like cacti and thorn bushes are adapted to conserve water in arid conditions.', 'easy', 1, 17),

('q_geo_2023_018', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The ITCZ is associated with:', 'multiple_choice', '["A. Dry conditions", "B. Heavy rainfall", "C. Cold temperatures", "D. High pressure"]', 'B', 'The Inter-Tropical Convergence Zone (ITCZ) is a low pressure zone where trade winds meet, causing heavy rainfall.', 'medium', 1, 18),

('q_geo_2023_019', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Deforestation leads to:', 'multiple_choice', '["A. Increased rainfall", "B. Soil erosion and climate change", "C. Improved soil fertility", "D. Reduced flooding"]', 'B', 'Deforestation causes soil erosion, loss of biodiversity, and contributes to climate change.', 'easy', 1, 19),

('q_geo_2023_020', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The tropical rainforest has:', 'multiple_choice', '["A. One layer of trees", "B. Two layers of trees", "C. Multiple canopy layers", "D. No tree cover"]', 'C', 'Tropical rainforests have multiple layers: emergent, canopy, understory, and forest floor.', 'easy', 1, 20),

-- Map Work and Statistics (Q21-30)
('q_geo_2023_021', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'A topographical map shows:', 'multiple_choice', '["A. Only roads and buildings", "B. Physical and human features", "C. Only population data", "D. Only political boundaries"]', 'B', 'Topographical maps show both physical features (relief, rivers) and human features (roads, settlements).', 'easy', 1, 21),

('q_geo_2023_022', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The gradient of a slope is calculated by:', 'multiple_choice', '["A. Horizontal distance ÷ Vertical rise", "B. Vertical rise ÷ Horizontal distance", "C. Horizontal distance × Vertical rise", "D. Vertical rise + Horizontal distance"]', 'B', 'Gradient = Vertical rise ÷ Horizontal distance, often expressed as a ratio (e.g., 1:10).', 'medium', 1, 22),

('q_geo_2023_023', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Isobars on a map join places with equal:', 'multiple_choice', '["A. Temperature", "B. Rainfall", "C. Atmospheric pressure", "D. Height"]', 'C', 'Isobars are lines connecting places with equal atmospheric pressure.', 'easy', 1, 23),

('q_geo_2023_024', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'If it is 12 noon at Greenwich, what time is it at 45°E?', 'multiple_choice', '["A. 9 am", "B. 3 pm", "C. 6 pm", "D. 12 midnight"]', 'B', 'Each 15° of longitude equals 1 hour. 45°E ÷ 15 = 3 hours ahead. So 12 noon + 3 = 3 pm.', 'medium', 1, 24),

('q_geo_2023_025', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'A choropleth map uses:', 'multiple_choice', '["A. Dots to show distribution", "B. Shading to show data variations", "C. Lines to show movement", "D. Symbols to show locations"]', 'B', 'Choropleth maps use different shades or colors to show variations in data across areas.', 'medium', 1, 25),

('q_geo_2023_026', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The conventional sign for a church on a map is:', 'multiple_choice', '["A. A circle", "B. A cross with a square base", "C. A triangle", "D. A star"]', 'B', 'Churches are typically shown as a cross with a square base on topographical maps.', 'easy', 1, 26),

('q_geo_2023_027', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Cross-section of a map is used to show:', 'multiple_choice', '["A. Vegetation types", "B. Relief profile between two points", "C. Population density", "D. Land use patterns"]', 'B', 'A cross-section shows the vertical profile (relief) of land between two points on a map.', 'medium', 1, 27),

('q_geo_2023_028', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'A representative fraction scale of 1:100,000 means:', 'multiple_choice', '["A. 1 km on map = 100,000 km on ground", "B. 1 cm on map = 100,000 cm on ground", "C. 1 cm on map = 100,000 m on ground", "D. 1 m on map = 100,000 cm on ground"]', 'B', 'RF 1:100,000 means 1 unit on the map represents 100,000 of the same units on the ground.', 'medium', 1, 28),

('q_geo_2023_029', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The back bearing is calculated by:', 'multiple_choice', '["A. Adding 180° if less than 180°", "B. Subtracting 90° always", "C. Adding 90° always", "D. Subtracting 180° if more than 180°"]', 'A', 'Back bearing = Forward bearing ± 180°. Add 180° if less than 180°, subtract if more.', 'medium', 1, 29),

('q_geo_2023_030', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'An escarpment is shown on a map by:', 'multiple_choice', '["A. Widely spaced contours followed by closely spaced ones", "B. Evenly spaced contours", "C. Contours very far apart", "D. No contours at all"]', 'A', 'An escarpment shows as gentle slope (wide spacing) then steep slope (close spacing) of contours.', 'hard', 1, 30),

-- Human and Economic Geography (Q31-40)
('q_geo_2023_031', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'An ageing population is characterized by:', 'multiple_choice', '["A. High birth rate", "B. Large proportion of elderly people", "C. Rapid population growth", "D. High death rate"]', 'B', 'An ageing population has a large proportion of elderly people, often due to low birth rates and high life expectancy.', 'easy', 1, 31),

('q_geo_2023_032', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Plantation agriculture is characterized by:', 'multiple_choice', '["A. Small farm size", "B. Production for family consumption", "C. Large-scale production of cash crops", "D. Mixed farming practices"]', 'C', 'Plantation agriculture involves large-scale cultivation of cash crops like rubber, oil palm, and cocoa for export.', 'easy', 1, 32),

('q_geo_2023_033', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Nomadic herding is practiced in:', 'multiple_choice', '["A. Tropical rainforests", "B. Semi-arid and arid regions", "C. Temperate zones", "D. Coastal areas"]', 'B', 'Nomadic herding is practiced in semi-arid and arid regions where people move with their livestock in search of pasture.', 'easy', 1, 33),

('q_geo_2023_034', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The most important factor for fishing is:', 'multiple_choice', '["A. Deep ocean waters", "B. Continental shelf with plankton", "C. Warm ocean currents only", "D. Rocky coastlines"]', 'B', 'Continental shelves with abundant plankton (fish food) are most important for fishing.', 'medium', 1, 34),

('q_geo_2023_035', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Lumbering is best developed in:', 'multiple_choice', '["A. Deserts", "B. Temperate coniferous forests", "C. Savanna grasslands", "D. Tundra regions"]', 'B', 'Lumbering is most developed in temperate coniferous forests where trees are easily accessible and marketable.', 'medium', 1, 35),

('q_geo_2023_036', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Secondary industries are engaged in:', 'multiple_choice', '["A. Extracting raw materials", "B. Manufacturing and processing", "C. Providing services", "D. Information technology"]', 'B', 'Secondary industries transform raw materials into finished or semi-finished products.', 'easy', 1, 36),

('q_geo_2023_037', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The main export of Nigeria is:', 'multiple_choice', '["A. Cocoa", "B. Groundnuts", "C. Petroleum", "D. Tin"]', 'C', 'Petroleum (crude oil) is Nigeria''s main export, accounting for most of its export revenue.', 'easy', 1, 37),

('q_geo_2023_038', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'A Free Trade Zone is established to:', 'multiple_choice', '["A. Restrict imports", "B. Attract foreign investment", "C. Increase taxes", "D. Reduce exports"]', 'B', 'Free Trade Zones offer tax incentives and reduced regulations to attract foreign investment and boost exports.', 'medium', 1, 38),

('q_geo_2023_039', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Desertification is caused by:', 'multiple_choice', '["A. Planting more trees", "B. Overgrazing and deforestation", "C. Building dams", "D. Crop rotation"]', 'B', 'Desertification is the degradation of land caused by overgrazing, deforestation, poor farming practices, and climate change.', 'easy', 1, 39),

('q_geo_2023_040', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Sustainable development aims to:', 'multiple_choice', '["A. Maximize current resource use", "B. Meet present needs without compromising future generations", "C. Stop all development", "D. Increase industrial pollution"]', 'B', 'Sustainable development meets present needs while ensuring resources remain for future generations.', 'easy', 1, 40),

-- Regional Geography of Africa (Q41-50)
('q_geo_2023_041', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The largest desert in Africa is the:', 'multiple_choice', '["A. Kalahari", "B. Namib", "C. Sahara", "D. Nubian"]', 'C', 'The Sahara is the world''s largest hot desert, covering much of North Africa.', 'easy', 1, 41),

('q_geo_2023_042', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'Lake Victoria is shared by:', 'multiple_choice', '["A. Nigeria, Cameroon, Chad", "B. Kenya, Uganda, Tanzania", "C. Ethiopia, Sudan, Egypt", "D. Zambia, Zimbabwe, Botswana"]', 'B', 'Lake Victoria, Africa''s largest lake, is shared by Kenya, Uganda, and Tanzania.', 'medium', 1, 42),

('q_geo_2023_043', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The Nile River flows through which direction?', 'multiple_choice', '["A. East to West", "B. West to East", "C. South to North", "D. North to South"]', 'C', 'The Nile flows from south (Lake Victoria area) to north (Mediterranean Sea).', 'easy', 1, 43),

('q_geo_2023_044', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The Great Rift Valley runs through:', 'multiple_choice', '["A. West Africa", "B. East Africa", "C. North Africa", "D. Southern Africa"]', 'B', 'The Great Rift Valley stretches through East Africa from Mozambique to the Red Sea.', 'easy', 1, 44),

('q_geo_2023_045', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The Volta River system is located in:', 'multiple_choice', '["A. Nigeria", "B. Ghana", "C. Cameroon", "D. Senegal"]', 'B', 'The Volta River system, including Lake Volta, is in Ghana.', 'easy', 1, 45),

('q_geo_2023_046', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The highest mountain in Africa is:', 'multiple_choice', '["A. Mount Kenya", "B. Mount Cameroon", "C. Mount Kilimanjaro", "D. Atlas Mountains"]', 'C', 'Mount Kilimanjaro in Tanzania at 5,895m is Africa''s highest peak.', 'easy', 1, 46),

('q_geo_2023_047', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'ECOWAS promotes:', 'multiple_choice', '["A. Military cooperation only", "B. Economic integration in West Africa", "C. Oil production", "D. Mining activities"]', 'B', 'ECOWAS (Economic Community of West African States) promotes economic integration and cooperation.', 'easy', 1, 47),

('q_geo_2023_048', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The Jos Plateau is known for mining of:', 'multiple_choice', '["A. Gold", "B. Tin and columbite", "C. Diamond", "D. Copper"]', 'B', 'The Jos Plateau in Nigeria is famous for tin and columbite mining.', 'medium', 1, 48),

('q_geo_2023_049', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The main port of Ghana is:', 'multiple_choice', '["A. Accra", "B. Tema", "C. Takoradi", "D. Cape Coast"]', 'B', 'Tema is Ghana''s main port, handling most of the country''s imports and exports.', 'medium', 1, 49),

('q_geo_2023_050', 'subj_wassce_geography', 'exam_wassce', 'paper_wassce_1', 'pp_wassce_geo_2023_1', 'The Akosombo Dam provides:', 'multiple_choice', '["A. Irrigation only", "B. Hydroelectric power", "C. Drinking water only", "D. Flood control only"]', 'B', 'The Akosombo Dam on the Volta River generates hydroelectric power for Ghana and neighboring countries.', 'easy', 1, 50);
