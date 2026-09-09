import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-09-09T15:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const batchId = 'wassce-social-studies-sprint3-001';
const contentLabel = 'Original BrillaPrep curriculum-aligned WASSCE Social Studies practice questions; not official WAEC (West African Examinations Council) examination material. Use the enabled feedback channel to report corrections.';
const releaseSourceUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';

const curriculumSource = {
  publisher: 'National Council for Curriculum and Assessment, Ghana',
  title: 'Secondary Education Curriculum — Social Studies',
  url: releaseSourceUrl,
  use: 'curriculum_blueprint_only',
};

// Topic ids are the prod-canonical rows for subj_wassce_social (verified
// read-only against brilla-db on 2026-09-09). The nine topic_wassce_p2_soc_*
// rows were created by migration 366 (slugs wassce-p2-soc-*); migration 553
// re-asserts every row with INSERT OR IGNORE so it no-ops on prod and on
// fresh baselines. The sprint fills every have:0 easy MCQ cell (9 topics × 4)
// and fully fills the six have:0 medium MCQ cells for GOV, CIV, MED, MIG, CUL
// and EDU; the remaining medium cells, all hard cells and all
// short_answer/structured cells stay open for a later sprint because the
// easy+medium MCQ cells alone exceed this sprint's target.
const topics = [
  ['SOC-GOV', 'topic_wassce_p2_soc_gov', 'Governance and democracy',
    'Explain how the 1992 Constitution, the arms of government and democratic principles promote good governance in Ghana.'],
  ['SOC-CIV', 'topic_wassce_p2_soc_civ', 'Elections and civic life',
    'Analyse Ghana\u2019s electoral processes and the civic rights and responsibilities of citizens.'],
  ['SOC-MED', 'topic_wassce_p2_soc_med', 'Media and national development',
    'Assess the roles, ethics and effects of the media in Ghana\u2019s national development.'],
  ['SOC-MIG', 'topic_wassce_p2_soc_mig', 'Population and migration',
    'Evaluate the causes and consequences of population change and rural-urban migration in Ghana.'],
  ['SOC-CUL', 'topic_wassce_p2_soc_cul', 'Culture and globalization',
    'Explain Ghanaian cultural values and how they can be preserved amid globalizing influences.'],
  ['SOC-EDU', 'topic_wassce_p2_soc_edu', 'Adolescent health and education',
    'Analyse adolescent health issues and their consequences for education and life chances in Ghana.'],
  ['SOC-ECO', 'topic_wassce_p2_soc_eco', 'Agriculture and the economy',
    'Explain the contribution of agriculture to employment, food security and industrial growth in Ghana.'],
  ['SOC-ENV', 'topic_wassce_p2_soc_env', 'Environment and illegal mining',
    'Evaluate the environmental and social effects of illegal mining and the measures available to control it.'],
  ['SOC-EMP', 'topic_wassce_p2_soc_emp', 'Work and unemployment',
    'Describe the world of work, the types of unemployment and the measures that reduce youth unemployment.'],
];

const q = (topicCode, difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective) =>
  ({ topicCode, type: 'multiple_choice', difficulty, prompt, correct, wrong, solution, commandWord, assessmentObjective });

const questions = [
  // --- Governance and democracy (topic_wassce_p2_soc_gov): 4 easy, 4 medium MCQ
  q('SOC-GOV', 'easy', 'Which system of government gives citizens the power to choose their leaders through regular, free elections?', 'Democracy', ['Autocracy', 'Monarchy', 'Military rule'],
    'Democracy vests supreme power in the people, who exercise it directly or through freely elected representatives chosen in periodic elections. (An autocracy concentrates power in one ruler, a monarchy vests it in a hereditary sovereign, and military rule seizes power by force — none of these rests on elections.)', 'Identify', 'AO1'),
  q('SOC-GOV', 'easy', 'How many arms of government does the 1992 Constitution of Ghana establish?', 'Three', ['Two', 'Four', 'Five'],
    'The 1992 Constitution establishes three arms of government: the Executive (President and ministers), the Legislature (Parliament) and the Judiciary (the courts). (Four wrongly counts the civil service, which supports the Executive but is not an arm of government.)', 'State', 'AO1'),
  q('SOC-GOV', 'easy', 'Which arm of government is responsible for interpreting the laws of Ghana?', 'The Judiciary', ['The Executive', 'The Legislature', 'The Electoral Commission'],
    'The Judiciary — the courts headed by the Chief Justice — interprets and applies the laws. The Legislature makes the laws and the Executive implements and enforces them, so those options swap the functions of the three arms. The Electoral Commission only conducts elections.', 'Identify', 'AO1'),
  q('SOC-GOV', 'easy', 'In which year did Ghana\u2019s Fourth Republic come into being?', '1993', ['1992', '1957', '1979'],
    'Although the Constitution was approved by referendum in April 1992, the Fourth Republic was inaugurated on 7 January 1993 when the first President and Parliament under it took office. (1992 is the referendum year — the common mix-up; 1957 is independence; 1979 began the short-lived Third Republic.)', 'State', 'AO1'),
  q('SOC-GOV', 'medium', 'The constitutional arrangement that allows each arm of government to limit the powers of the others so that no arm becomes too powerful is known as...', 'Checks and balances', ['Separation of powers', 'Rule of law', 'Judicial independence'],
    'Separation of powers merely divides government functions among the three arms; checks and balances is the further mechanism by which each arm restrains the others — for example, presidential assent to bills and judicial review of executive action. (Rule of law means everyone is subject to the law; judicial independence protects judges from interference.)', 'Explain', 'AO2'),
  q('SOC-GOV', 'medium', 'Which court in Ghana has the final authority to interpret the provisions of the 1992 Constitution?', 'The Supreme Court', ['The High Court', 'The Court of Appeal', 'The Regional Tribunal'],
    'Article 130 of the 1992 Constitution gives the Supreme Court exclusive, original jurisdiction in the interpretation and enforcement of the Constitution, so its word is final. The High Court and Court of Appeal handle ordinary civil and criminal matters and appeals, and regional tribunals no longer exist under the current court structure.', 'Identify', 'AO2'),
  q('SOC-GOV', 'medium', 'Which of the following is NOT a feature of a democratic system of government?', 'Rule by a single political party without periodic elections', ['Free and fair periodic elections', 'Protection of fundamental human rights', 'Equality of all citizens before the law'],
    'Democracies hold periodic competitive elections, protect fundamental human rights and treat citizens equally before the law. Permanent one-party rule without elections removes the people\u2019s power to change leaders, so it contradicts democracy. (The other three options are all standard features of democratic governance.)', 'Select', 'AO2'),
  q('SOC-GOV', 'medium', 'Under the 1992 Constitution of Ghana, a person elected as President may serve a maximum of...', 'Two four-year terms', ['Three four-year terms', 'Two five-year terms', 'Unlimited terms of office'],
    'Article 66 of the 1992 Constitution sets a presidential term at four years and bars anyone who has been elected twice from standing again — a maximum of two four-year terms. (Two five-year terms confuses Ghana with countries such as Nigeria\u2019s neighbours with five-year terms; unlimited terms would remove a key check on executive power.)', 'State', 'AO2'),

  // --- Elections and civic life (topic_wassce_p2_soc_civ): 4 easy, 4 medium MCQ
  q('SOC-CIV', 'easy', 'What is the minimum age at which a Ghanaian citizen may register to vote in public elections?', '18 years', ['16 years', '21 years', '25 years'],
    'Article 42 of the 1992 Constitution grants the vote to every citizen of Ghana who is eighteen years or above and of sound mind. (16 is below the legal age of majority; 21 confuses voting with older historical thresholds; 25 is the minimum age for election to Parliament, not for voting.)', 'State', 'AO1'),
  q('SOC-CIV', 'easy', 'Which body is responsible for conducting and supervising all public elections and referenda in Ghana?', 'The Electoral Commission', ['The National Commission for Civic Education', 'The Judicial Service', 'The Ministry of the Interior'],
    'The Electoral Commission of Ghana, established under Article 43 of the 1992 Constitution, registers voters, demarcates constituencies and conducts elections. (The NCCE only educates citizens on their civic duties, the Judicial Service administers the courts, and the Ministry of the Interior handles internal security — none conducts elections.)', 'Identify', 'AO1'),
  q('SOC-CIV', 'easy', 'The right of qualified citizens to vote in elections is known as...', 'The franchise', ['A referendum', 'Naturalization', 'A census'],
    'The franchise (or suffrage) is the right to vote in public elections. A referendum is a vote on a single national question, naturalization is the legal process of acquiring citizenship, and a census is an official population count — none of them names the right to vote itself.', 'Identify', 'AO1'),
  q('SOC-CIV', 'easy', 'Which of the following is a civic responsibility of a Ghanaian citizen?', 'Paying taxes honestly and promptly', ['Evading taxes when business is slow', 'Refusing to obey lawful court orders', 'Destroying posters of rival political parties'],
    'Civic responsibilities include paying taxes, voting, obeying the law and defending the state. Tax revenue funds schools, hospitals and roads. (Tax evasion, defying court orders and destroying opponents\u2019 campaign materials are all unlawful acts that undermine civic life.)', 'Select', 'AO1'),
  q('SOC-CIV', 'medium', 'The main reason Ghana uses the secret ballot in elections is to...', 'Protect voters from intimidation so they can choose freely', ['Speed up the counting of ballots', 'Reduce the cost of conducting elections', 'Prevent unregistered persons from voting'],
    'Because no one can see how an individual voted, the secret ballot shields voters from threats, bribery and victimization, making the choice genuinely free. (Counting speed and cost depend on logistics, not secrecy, and the voter register — not the ballot — stops unregistered persons from voting.)', 'Explain', 'AO2'),
  q('SOC-CIV', 'medium', 'An election held to fill a parliamentary seat that falls vacant between general elections is called...', 'A by-election', ['A referendum', 'A party primary', 'A run-off election'],
    'A by-election fills a single seat vacated through death, resignation or disqualification of a Member of Parliament between general elections. (A referendum decides a national question, a primary selects a party\u2019s candidate, and a run-off is a second round held when no presidential candidate wins an outright majority.)', 'Identify', 'AO2'),
  q('SOC-CIV', 'medium', 'A referendum differs from a general election because a referendum...', 'Asks voters to decide a single specific national question', ['Chooses the President and Members of Parliament', 'Is held on a fixed four-year cycle', 'Is organized by the political parties themselves'],
    'In a referendum the electorate votes Yes or No on one question — such as the approval of the 1992 Constitution — rather than choosing office holders. General elections choose leaders, follow a constitutional timetable and are conducted by the Electoral Commission, not by parties. (The other options describe general-election features wrongly attributed to a referendum.)', 'Explain', 'AO2'),
  q('SOC-CIV', 'medium', 'Which of the following is most likely to promote free and fair elections in Ghana?', 'Continuous voter education by the NCCE and an independent Electoral Commission', ['Allowing each party to count its own ballots', 'Restricting voter registration to property owners', 'Banning domestic and foreign election observers'],
    'Informed voters and a neutral, independent election management body are the twin pillars of credible elections. (Party-controlled counting invites fraud, property-based registration violates universal adult suffrage, and barring observers removes transparency that deters malpractice.)', 'Select', 'AO2'),

  // --- Media and national development (topic_wassce_p2_soc_med): 4 easy, 4 medium MCQ
  q('SOC-MED', 'easy', 'The media are often described as the Fourth Estate because they...', 'Act as a watchdog over the Executive, Legislature and Judiciary', ['Form the fourth arm of government', 'Are owned entirely by the state', 'Control the decisions of the courts'],
    'By investigating and publicizing the actions of those in power, the media hold the three arms of government accountable — hence the label Fourth Estate. The media are not a formal arm of government, most Ghanaian media are privately owned, and court decisions remain the preserve of the Judiciary.', 'Explain', 'AO1'),
  q('SOC-MED', 'easy', 'Which of the following is an example of print media in Ghana?', 'The Daily Graphic newspaper', ['An FM radio station', 'A television news channel', 'A WhatsApp broadcast message'],
    'Print media communicate through printed words and images — newspapers and magazines such as the Daily Graphic. Radio and television are electronic (broadcast) media, and WhatsApp messages are digital or new media, so neither category is print.', 'Identify', 'AO1'),
  q('SOC-MED', 'easy', 'Which of the following is a form of electronic media widely used in Ghana?', 'FM radio broadcasting', ['A printed newspaper', 'A roadside billboard', 'A hand-written letter'],
    'Electronic media transmit information by electronic signals — radio and television broadcasting reach most Ghanaian households. Newspapers and billboards are print and outdoor media respectively, and a hand-written letter is personal correspondence, not a mass medium.', 'Identify', 'AO1'),
  q('SOC-MED', 'easy', 'Which of these is a social media platform commonly used by young Ghanaians?', 'WhatsApp', ['The Ghana Broadcasting Corporation', 'The Daily Graphic', 'GTV'],
    'WhatsApp is a social networking and messaging platform on which users create and share content. The Ghana Broadcasting Corporation, the Daily Graphic and GTV are traditional state or print media houses that produce one-way mass communication rather than interactive social networking.', 'Identify', 'AO1'),
  q('SOC-MED', 'medium', 'Which of the following best explains how the media contribute to the national development of Ghana?', 'They educate the public on health, agriculture and civic matters and expose wrongdoing', ['They replace the formal school system entirely', 'They collect taxes on behalf of the government', 'They appoint ministers and Members of Parliament'],
    'Radio, television, newspapers and digital platforms carry health campaigns, agricultural extension advice and civic education in local languages, while investigative reporting exposes corruption — all of which support development. (Schools, tax collection and appointments are the work of the education system, the Ghana Revenue Authority and constitutional office holders, not the media.)', 'Explain', 'AO2'),
  q('SOC-MED', 'medium', 'The deliberate creation and spread of false information through the media in order to deceive the public is known as...', 'Disinformation', ['Misinformation', 'Sensationalism', 'Censorship'],
    'Disinformation is false information spread with the intent to deceive; misinformation is false information shared without that intent — the key distinction examiners look for. Sensationalism is exaggerating true stories to attract attention, and censorship is the suppression of information by authority.', 'Identify', 'AO2'),
  q('SOC-MED', 'medium', 'A journalist who reports only the viewpoint of one political party in a contested election story violates the media ethic of...', 'Balance and fairness', ['Confidentiality of sources', 'Copyright protection', 'Freedom of the press'],
    'Professional ethics require journalists to give all sides of a contested story a fair hearing so the public can judge for itself. Confidentiality of sources protects informants, copyright protects creative work, and press freedom protects the journalist — none of them addresses one-sided reporting.', 'Explain', 'AO2'),
  q('SOC-MED', 'medium', 'Which of the following is a negative effect of media misuse on national development?', 'The spread of fake news can incite panic, hatred and social conflict', ['Health campaigns on radio improve public hygiene', 'Coverage of budgets keeps citizens informed', 'Advertising creates markets for local businesses'],
    'When media houses or users publish unverified or fabricated stories, the resulting panic and inter-group hostility can destabilize communities and slow development. The other three options are positive developmental roles of the media, so they cannot be answers to a question about negative effects.', 'Select', 'AO2'),

  // --- Population and migration (topic_wassce_p2_soc_mig): 4 easy, 4 medium MCQ
  q('SOC-MIG', 'easy', 'The official count of all the people living in a country at a particular time is called...', 'A population census', ['A voter register', 'An opinion poll', 'A sample survey'],
    'A population census enumerates every person in the country, recording numbers, age, sex and housing conditions. A voter register lists only eligible voters, and opinion polls and sample surveys collect data from small selected groups rather than the whole population.', 'Identify', 'AO1'),
  q('SOC-MIG', 'easy', 'Ghana aims to conduct a national population and housing census approximately every...', 'Ten years', ['Two years', 'Five years', 'Twenty years'],
    'Ghana\u2019s censuses — 1960, 1970, 1984, 2000, 2010 and 2021 — follow the international decennial (ten-year) standard recommended by the United Nations. Two- and five-year intervals would be prohibitively expensive, and twenty years would leave planners with badly outdated data.', 'State', 'AO1'),
  q('SOC-MIG', 'easy', 'The movement of people from the countryside to settle permanently in towns and cities is known as...', 'Rural-urban migration', ['Emigration', 'Immigration', 'Transhumance'],
    'Rural-urban migration is internal movement from villages to urban centres within the same country. Emigration and immigration cross international borders (leaving and entering a country respectively), and transhumance is the seasonal movement of livestock herders in search of pasture.', 'Identify', 'AO1'),
  q('SOC-MIG', 'easy', 'A Ghanaian who leaves Ghana to settle permanently in another country is described in Ghana as...', 'An emigrant', ['An immigrant', 'A refugee', 'A commuter'],
    'An emigrant exits (e-) his or her home country to live abroad; the same person is an immigrant (im-) to the receiving country. A refugee flees persecution or war — a specific legal status, not every migrant — and a commuter travels daily between home and work without relocating.', 'Identify', 'AO1'),
  q('SOC-MIG', 'medium', 'Which of the following is a push factor of rural-urban migration in Ghana?', 'Lack of jobs and social amenities in the villages', ['Better-paid employment in the cities', 'Abundant fertile farmland in the village', 'Peaceful and secure rural communities'],
    'Push factors are conditions at the origin that drive people away — rural poverty, few jobs and poor schools, hospitals and water supply. Better-paid city jobs are a pull factor (an attraction at the destination), and abundant farmland and peace would keep people in the village rather than push them out.', 'Explain', 'AO2'),
  q('SOC-MIG', 'medium', 'The persistent departure of highly trained Ghanaians such as doctors, nurses and lecturers to work abroad is commonly referred to as...', 'Brain drain', ['Labour turnover', 'Deportation', 'Internal migration'],
    'Brain drain is the loss of skilled human capital through emigration, which deprives Ghana\u2019s hospitals and universities of expertise the state paid to train. Labour turnover is routine movement between jobs, deportation is forced removal by a state, and internal migration stays within Ghana\u2019s borders.', 'Identify', 'AO2'),
  q('SOC-MIG', 'medium', 'The dependency ratio of a population measures...', 'The proportion of the young and the elderly who depend on the working-age population', ['The ratio of births to deaths in a year', 'The share of the population in formal employment', 'The number of dependants a taxpayer claims'],
    'The dependency ratio compares those below 15 and above 64 with the working-age group (15–64); a high ratio means each worker supports many non-workers, straining family income and state services. (Births-to-deaths is about natural increase, and formal employment share and tax claims are unrelated concepts.)', 'Explain', 'AO2'),
  q('SOC-MIG', 'medium', 'Which of the following is a negative effect of rapid urban growth driven by rural-urban migration in Ghana?', 'The growth of overcrowded slums and severe pressure on housing and sanitation', ['A steady fall in the urban population', 'Reduced demand for urban services', 'The disappearance of traffic congestion'],
    'When migration outpaces planning, cities such as Accra and Kumasi develop overcrowded settlements where housing, water, toilets and waste disposal cannot cope. The other options are the opposite of what happens: rapid in-migration raises the urban population and the demand for services, and worsens congestion.', 'Select', 'AO2'),

  // --- Culture and globalization (topic_wassce_p2_soc_cul): 4 easy, 4 medium MCQ
  q('SOC-CUL', 'easy', 'The total way of life of a people — including their language, food, dress, beliefs and values — is known as...', 'Culture', ['Climate', 'Population', 'Governance'],
    'Culture is the learned, shared way of life of a group, covering both material objects and non-material elements such as language and beliefs. Climate describes weather patterns, population describes numbers of people, and governance is only one narrow institution within a way of life.', 'Identify', 'AO1'),
  q('SOC-CUL', 'easy', 'Which of the following is a traditional festival celebrated in Ghana?', 'Homowo of the Ga people', ['Christmas', 'Eid al-Fitr', 'Easter'],
    'Homowo — the Ga \u201chooting at hunger\u201d harvest festival — is an indigenous Ghanaian festival, like Aboakyir of the Effutu and Odwira of the Akan. Christmas, Eid al-Fitr and Easter are Christian and Islamic festivals of foreign origin, not traditional Ghanaian festivals.', 'Identify', 'AO1'),
  q('SOC-CUL', 'easy', 'The process by which countries and peoples of the world become increasingly interconnected through trade, technology and communication is called...', 'Globalization', ['Urbanization', 'Industrialization', 'Nationalization'],
    'Globalization is the growing integration of economies, cultures and communication across borders. Urbanization is the growth of towns, industrialization is the spread of manufacturing industry, and nationalization is state takeover of private assets — none of them describes worldwide interconnectedness.', 'Identify', 'AO1'),
  q('SOC-CUL', 'easy', 'Which of the following is an aspect of Ghana\u2019s material culture?', 'Kente cloth and carved traditional stools', ['Respect for elders', 'The Twi language', 'Belief in the Supreme Being'],
    'Material culture consists of tangible, physical objects a society makes — cloth, stools, pottery and tools. Respect for elders, language and religious belief are intangible, non-material culture: they exist as values, symbols and ideas rather than objects.', 'Identify', 'AO1'),
  q('SOC-CUL', 'medium', 'Which of the following is a negative effect of globalization on Ghanaian culture?', 'The erosion of local languages and customs as foreign lifestyles dominate the youth', ['Faster communication with relatives abroad', 'Wider export markets for Ghanaian products', 'Easier access to global information and technology'],
    'Constant exposure to foreign media and lifestyles leads many young Ghanaians to abandon mother tongues, dress and customs, weakening cultural identity. Faster communication, wider markets and easier information access are widely recognized benefits of globalization, so they cannot answer a question about its negative effects.', 'Select', 'AO2'),
  q('SOC-CUL', 'medium', 'The spread of cultural traits such as music, dress styles and foods from one society to another is known as...', 'Cultural diffusion', ['Ethnocentrism', 'Enculturation', 'Cultural conflict'],
    'Cultural diffusion is the transmission of cultural elements between societies — for example the spread of hiplife rhythms or foreign fast food. Ethnocentrism is judging other cultures by the standards of one\u2019s own, enculturation is learning one\u2019s own culture from birth, and cultural conflict is a clash between incompatible cultural values.', 'Identify', 'AO2'),
  q('SOC-CUL', 'medium', 'Traditional festivals in Ghana contribute to national development mainly by...', 'Promoting unity and attracting tourists whose spending supports local economies', ['Replacing the work of Metropolitan and District Assemblies', 'Providing free housing for community members', 'Reducing the country\u2019s national debt directly'],
    'Festivals such as Aboakyir and Hogbetsotso reunite families and clans, settle disputes and draw domestic and foreign tourists whose spending boosts hospitality, transport and crafts. Assemblies remain responsible for local administration, and festivals neither build houses nor pay down sovereign debt.', 'Explain', 'AO2'),
  q('SOC-CUL', 'medium', 'A global citizen is best described as a person who...', 'Identifies with the wider world community and acts on global issues while respecting local cultures', ['Holds the citizenship of many different countries', 'Travels abroad frequently on business', 'Completely rejects his or her own culture'],
    'Global citizenship is an outlook: awareness of worldwide interdependence, concern for issues such as climate change and human rights, and respect for diversity — not a legal status. Multiple passports and frequent travel are neither necessary nor sufficient, and rejecting one\u2019s own culture contradicts the respect for diversity the concept requires.', 'Explain', 'AO2'),

  // --- Adolescent health and education (topic_wassce_p2_soc_edu): 4 easy, 4 medium MCQ
  q('SOC-EDU', 'easy', 'According to the World Health Organization, adolescence covers the age range...', '10 to 19 years', ['1 to 5 years', '5 to 12 years', '20 to 29 years'],
    'The WHO defines adolescents as persons aged 10–19 years, the transition from childhood to adulthood. Ages 1–5 are early childhood, 5–12 spans middle childhood with only its tail entering adolescence, and 20–29 is youth or early adulthood.', 'State', 'AO1'),
  q('SOC-EDU', 'easy', 'The period of physical and emotional changes during which a child develops into an adult is called...', 'Puberty', ['Menopause', 'Infancy', 'Senescence'],
    'Puberty is the stage of rapid growth and sexual maturation — breast development, voice change, menstruation — marking the move into adulthood. Menopause ends reproductive life in middle age, infancy is the first year of life, and senescence is old-age decline.', 'Identify', 'AO1'),
  q('SOC-EDU', 'easy', 'The surest way for an adolescent to avoid sexually transmitted infections and unplanned pregnancy is...', 'Abstinence from premarital sex', ['Taking antibiotics regularly', 'Avoiding all social contact with friends', 'Using herbal mixtures after intercourse'],
    'Abstinence is the only method that is completely effective against sexually transmitted infections and pregnancy because it removes the risk entirely. Antibiotics do not prevent infection and misuse breeds resistance, avoiding friends is neither necessary nor protective, and unverified herbal mixtures offer no protection at all.', 'State', 'AO1'),
  q('SOC-EDU', 'easy', 'Which of the following best describes a balanced diet for a growing adolescent?', 'Meals containing the right proportions of carbohydrates, proteins, vitamins, minerals, fats and water', ['Eating only energy-giving foods such as rice and yam', 'Eating large quantities of meat every day', 'Skipping breakfast in order to stay slim'],
    'A balanced diet supplies every nutrient class in adequate proportion to fuel growth, learning and immunity. Starch-only meals lack protein and micronutrients, excessive meat unbalances the diet, and skipping meals deprives the growing body of energy and impairs concentration.', 'Select', 'AO1'),
  q('SOC-EDU', 'medium', 'Which of the following is a major consequence of teenage pregnancy for the education of the girl in Ghana?', 'Many pregnant girls drop out of school and lose qualifications and career prospects', ['It automatically earns the girl a scholarship', 'It shortens the school year for her classmates', 'It improves the girl\u2019s academic performance'],
    'Pregnancy and childcare interrupt schooling; many girls are withdrawn or drop out, ending their education and narrowing future employment options. The other options are plainly false — pregnancy brings no scholarship, has no effect on the school calendar, and the burden of childcare lowers rather than raises performance.', 'Explain', 'AO2'),
  q('SOC-EDU', 'medium', 'HIV CANNOT be transmitted through which of the following?', 'Shaking hands with or sharing meals with an infected person', ['Unprotected sexual intercourse', 'Transfusion of infected blood', 'Sharing contaminated needles and syringes'],
    'HIV spreads through specific body fluids during unprotected sex, contaminated blood and shared needles — not through casual contact such as handshakes, hugging, sharing food or mosquito bites. Knowing what does not transmit HIV helps adolescents avoid both infection and stigma towards infected persons.', 'Select', 'AO2'),
  q('SOC-EDU', 'medium', 'An adolescent who politely but firmly refuses to join friends in stealing an examination paper is demonstrating...', 'Assertiveness in resisting negative peer pressure', ['Low self-esteem', 'Rebellion against lawful authority', 'Aggressive behaviour'],
    'Assertiveness is the ability to state one\u2019s position and stand by sound values without aggression; refusing examination malpractice despite peer pressure is a textbook example. The student is confident rather than low in self-esteem, is upholding rather than defying lawful authority, and is calm rather than aggressive.', 'Explain', 'AO2'),
  q('SOC-EDU', 'medium', 'Which of the following is a long-term effect of substance abuse on an adolescent?', 'Addiction and damage to vital organs such as the liver and the brain', ['Improved concentration in class', 'Stronger and warmer family relationships', 'Better physical fitness and stamina'],
    'Prolonged abuse of alcohol, tramadol or cannabis produces dependence (addiction) and harms the liver, brain and heart, wrecking schooling and health. The other options describe benefits that substance abuse destroys: it impairs concentration, strains family ties and weakens the body.', 'Select', 'AO2'),

  // --- Agriculture and the economy (topic_wassce_p2_soc_eco): 4 easy MCQ
  q('SOC-ECO', 'easy', 'Which sector of the Ghanaian economy employs the largest share of the labour force?', 'Agriculture, including fishing and forestry', ['Banking and finance', 'Mining and quarrying', 'Manufacturing industry'],
    'Agriculture remains Ghana\u2019s largest single employer, engaging a large share of workers in crop farming, livestock, fishing and forestry, especially in rural areas. Banking, mining and manufacturing are capital-intensive and employ far fewer people despite their high output per worker.', 'Identify', 'AO1'),
  q('SOC-ECO', 'easy', 'Ghana\u2019s leading traditional cash crop, which earns the country significant foreign exchange, is...', 'Cocoa', ['Cassava', 'Maize', 'Plantain'],
    'Cocoa, grown mainly in the forest belt, is Ghana\u2019s flagship export crop and a major earner of foreign exchange through the Ghana Cocoa Board. Cassava, maize and plantain are staple food crops grown largely for the domestic market rather than for export.', 'Identify', 'AO1'),
  q('SOC-ECO', 'easy', 'Farming mainly to feed one\u2019s own family, with little or no surplus for sale, is known as...', 'Subsistence farming', ['Commercial farming', 'Plantation agriculture', 'Mixed farming'],
    'Subsistence farmers cultivate small plots with simple tools and consume nearly all they produce. Commercial and plantation farming target the market on a large scale, while mixed farming — combining crops and livestock — describes what is produced, not whether output is eaten or sold.', 'Identify', 'AO1'),
  q('SOC-ECO', 'easy', 'Which of the following is an example of agro-processing in Ghana?', 'Turning cocoa beans into cocoa butter and chocolate', ['Planting maize on a family plot', 'Harvesting fish from the Volta Lake', 'Rearing cattle for fresh milk'],
    'Agro-processing adds value to raw farm produce by manufacturing it into new products — cocoa beans into butter and chocolate, cassava into gari, tomatoes into paste. Planting, harvesting and rearing are primary farm activities that produce raw materials without transforming them.', 'Identify', 'AO1'),

  // --- Environment and illegal mining (topic_wassce_p2_soc_env): 4 easy MCQ
  q('SOC-ENV', 'easy', 'The local Ghanaian term for illegal small-scale gold mining is...', 'Galamsey', ['Quarrying', 'Surface mining', 'Sand winning'],
    'Galamsey — a corruption of \u201cgather them and sell\u201d — denotes unlicensed gold mining that evades regulation, unlike registered small-scale mining, which is legal. Quarrying extracts stone, surface mining is a legitimate licensed technique, and sand winning removes sand for construction.', 'Identify', 'AO1'),
  q('SOC-ENV', 'easy', 'Which of the following is a direct environmental effect of galamsey operations in Ghana?', 'Pollution of rivers such as the Pra and Ankobra with silt and mercury', ['Increased fish stocks in the rivers', 'Improved fertility of cocoa farmland', 'Expansion of forest cover in mining areas'],
    'Galamsey washes soil and mercury into rivers such as the Pra, Ankobra and Birim, making water turbid, costly to treat and poisonous to fish and people. Fish stocks fall, farmland is excavated and degraded, and forest is cleared — the exact opposite of the three distractors.', 'Select', 'AO1'),
  q('SOC-ENV', 'easy', 'The clearing of forests without replanting, leading to permanent loss of tree cover, is called...', 'Deforestation', ['Afforestation', 'Reforestation', 'Desertification'],
    'Deforestation is the removal of forest without replacement. Afforestation is planting trees where none existed, reforestation is replanting cleared forest, and desertification is the degradation of dry land into desert — a possible result of deforestation, not the clearing itself.', 'Identify', 'AO1'),
  q('SOC-ENV', 'easy', 'Which of the following is a renewable natural resource in Ghana?', 'Forest timber, when trees are replanted', ['Gold deposits', 'Crude oil reserves', 'Bauxite ore'],
    'Renewable resources regenerate within a human timescale: forests regrow if harvested sustainably and replanted, as do fisheries and solar energy. Gold, crude oil and bauxite are minerals that take millions of years to form, so once mined they are gone — non-renewable resources.', 'Identify', 'AO1'),

  // --- Work and unemployment (topic_wassce_p2_soc_emp): 4 easy MCQ
  q('SOC-EMP', 'easy', 'Unemployment is best defined as the situation in which...', 'People who are willing and able to work cannot find jobs', ['Workers go on strike for higher pay', 'People retire from active service', 'Students attend school on a full-time basis'],
    'The unemployed are members of the labour force who are willing, able and actively seeking work but cannot find it. Striking workers already have jobs, and retirees and full-time students are not in the labour force at all, so none of them counts as unemployed.', 'Identify', 'AO1'),
  q('SOC-EMP', 'easy', 'A farmer who is idle during the dry season, when no planting or harvesting takes place, experiences...', 'Seasonal unemployment', ['Structural unemployment', 'Frictional unemployment', 'Cyclical unemployment'],
    'Seasonal unemployment follows the calendar: farmhands, fishing crews and construction workers lose work in off-seasons. Structural unemployment comes from a mismatch of skills, frictional unemployment is the short gap while moving between jobs, and cyclical unemployment follows downturns in the business cycle.', 'Identify', 'AO1'),
  q('SOC-EMP', 'easy', 'A person who identifies a business opportunity, organizes resources and bears the risk of starting an enterprise is called...', 'An entrepreneur', ['A civil servant', 'A shareholder', 'A middleman'],
    'An entrepreneur combines land, labour and capital, takes the risk of failure and earns profit if the venture succeeds. A civil servant is a salaried state employee, a shareholder merely owns part of a company, and a middleman only links producers to buyers without organizing production.', 'Identify', 'AO1'),
  q('SOC-EMP', 'easy', 'Which of the following workers operates in Ghana\u2019s informal sector?', 'A self-employed market trader whose business is not registered', ['A teacher employed by the Ghana Education Service', 'A bank manager in a commercial bank', 'An engineer at a licensed mining company'],
    'The informal sector covers unregistered, unregulated, mostly small-scale work — market trading, street vending, artisan work — without formal contracts or social security. Teaching in public schools, banking and licensed mining are formal-sector jobs with registered employers and regulated conditions.', 'Identify', 'AO1'),
];

// --- Batch assembly ---------------------------------------------------------
function buildQuestion(source, sequence, mcqPosition) {
  const id = `q_was_soc_s3_${String(sequence).padStart(3, '0')}`;
  const base = {
    id,
    original: true,
    topicCode: source.topicCode,
    type: source.type,
    prompt: source.prompt,
    difficulty: source.difficulty,
    commandWord: source.commandWord,
    assessmentObjective: source.assessmentObjective,
    provenance: [curriculumSource],
  };
  const correctIndex = mcqPosition % 4;
  const rawOptions = [...source.wrong];
  rawOptions.splice(correctIndex, 0, source.correct);
  return {
    ...base,
    options: rawOptions.map((text, optionIndex) => ({
      label: labels[optionIndex],
      text,
      rationale: optionIndex === correctIndex
        ? `This is the supported answer. ${source.solution}`
        : 'This is a plausible misconception, but it does not follow from the analysis in the worked solution.',
    })),
    correctAnswer: labels[correctIndex],
    workedSolution: `${source.solution} Therefore the correct answer is ${labels[correctIndex]}: ${source.correct}.`,
    marks: 1,
    points: 1,
    timeLimit: 90,
  };
}

const builtQuestions = [];
{
  let mcqPosition = 0;
  questions.forEach((source, index) => {
    builtQuestions.push(buildQuestion(source, index + 1, mcqPosition));
    if (source.type === 'multiple_choice') mcqPosition += 1;
  });
}

const batch = {
  batchId,
  status: 'approved_for_beta',
  examTypeId: 'exam_wassce',
  provenance: [curriculumSource],
  review: {
    authoringMethod: 'original_curriculum_aligned',
    qualityAssurance: 'automated_beta',
    automatedChecksAt: generatedAt,
  },
  release: {
    channel: 'beta',
    contentLabel,
    officialExamBoardContent: false,
    feedbackEnabled: true,
  },
  subjects: [{
    subjectId: 'subj_wassce_social',
    specificationCode: 'BRILLA-WASSCE-SOCIAL-S3-001',
    sources: [curriculumSource],
    topics: topics.map(([code, , title, objective]) => ({ code, title, objective })),
    questions: builtQuestions,
  }],
};

// --- Validation -------------------------------------------------------------
const officialAttributionPattern = /\b(?:official\s+(?:waec|west african examinations council)|(?:waec|west african examinations council)[ -](?:approved|endorsed|authored|issued|certified))\b/i;
const nonOfficialDisclaimerPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/i;
const nonOfficialDisclaimerGlobalPattern = /\b(?:not|non[- ]?)\s+official\s+(?:waec|west african examinations council)\b/gi;

function assertNoFalseOfficialClaim(value, field, errors) {
  const withoutDisclaimer = String(value ?? '').replace(nonOfficialDisclaimerGlobalPattern, '');
  if (officialAttributionPattern.test(withoutDisclaimer)) errors.push(`${field} contains a false official-exam-board claim`);
}

const validation = validateQuestionBatch(batch, { mode: 'draft' });

// Every question in this batch is an MCQ: the nine have:0 easy cells receive
// four each, and the six highest-need have:0 medium cells receive four each.
const expectedCells = {
  'SOC-GOV': { easy: 4, mediumMcq: 4 },
  'SOC-CIV': { easy: 4, mediumMcq: 4 },
  'SOC-MED': { easy: 4, mediumMcq: 4 },
  'SOC-MIG': { easy: 4, mediumMcq: 4 },
  'SOC-CUL': { easy: 4, mediumMcq: 4 },
  'SOC-EDU': { easy: 4, mediumMcq: 4 },
  'SOC-ECO': { easy: 4, mediumMcq: 0 },
  'SOC-ENV': { easy: 4, mediumMcq: 0 },
  'SOC-EMP': { easy: 4, mediumMcq: 0 },
};

function inHouseValidation(errors) {
  if (batch.review.automatedChecksAt !== generatedAt) errors.push('review.automatedChecksAt mismatch');
  if (batch.release.channel !== 'beta') errors.push('release.channel must be beta');
  if (typeof batch.release.contentLabel !== 'string' || batch.release.contentLabel.trim().length < 40) errors.push('release.contentLabel too short');
  if (!nonOfficialDisclaimerPattern.test(batch.release.contentLabel)) errors.push('release.contentLabel must explicitly state the content is not official WAEC material');
  if (batch.release.officialExamBoardContent !== false) errors.push('release.officialExamBoardContent must be false');
  if (batch.release.feedbackEnabled !== true) errors.push('release.feedbackEnabled must be true');
  assertNoFalseOfficialClaim(batch.release.contentLabel, 'release.contentLabel', errors);

  const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
  const perTopic = new Map(topics.map(([code]) => [code, { easy: 0, mediumMcq: 0 }]));
  for (const subject of batch.subjects) {
    for (const question of subject.questions) {
      const cell = perTopic.get(question.topicCode);
      if (!cell) { errors.push(`${question.id}: unknown topicCode ${question.topicCode}`); continue; }
      if (question.type !== 'multiple_choice') { errors.push(`${question.id}: unexpected type ${question.type}`); continue; }
      if (question.difficulty === 'easy') cell.easy += 1;
      else if (question.difficulty === 'medium') cell.mediumMcq += 1;
      else errors.push(`${question.id}: unexpected difficulty ${question.difficulty}`);
      if (question.marks !== 1) errors.push(`${question.id}: MCQ marks must be 1`);
      if (question.points !== 1) errors.push(`${question.id}: MCQ points must be 1`);
      if (question.timeLimit !== 90) errors.push(`${question.id}: MCQ timeLimit must be 90`);
      letterCounts[question.correctAnswer] += 1;
      for (const option of question.options ?? []) assertNoFalseOfficialClaim(option.text, `${question.id}.options`, errors);
      if (!Array.isArray(question.provenance) || question.provenance[0]?.use !== 'curriculum_blueprint_only') errors.push(`${question.id}: per-item provenance missing`);
      assertNoFalseOfficialClaim(question.prompt, `${question.id}.prompt`, errors);
      assertNoFalseOfficialClaim(question.workedSolution, `${question.id}.workedSolution`, errors);
    }
  }
  for (const [code, expected] of Object.entries(expectedCells)) {
    const actual = perTopic.get(code);
    if (!actual) { errors.push(`${code}: no questions found`); continue; }
    if (actual.easy !== expected.easy || actual.mediumMcq !== expected.mediumMcq) {
      errors.push(`${code}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
    }
  }
  for (const label of labels) {
    if (letterCounts[label] !== 15) errors.push(`correct answer letter ${label} should appear 15 times, found ${letterCounts[label]}`);
  }
}

const houseErrors = [];
inHouseValidation(houseErrors);
validation.errors.push(...houseErrors);
if (!validation.valid) throw new Error(`Generated batch failed validation:\n${validation.errors.join('\n')}`);

async function collectExistingContent() {
  const existing = new Map();
  const seedSql = await readFile(resolve(sourceRoot, 'database/seed.sql'), 'utf8');
  for (const match of seedSql.matchAll(/'(?:''|[^'])*'/g)) {
    const literal = match[0].slice(1, -1).replaceAll("''", "'");
    const normalized = normalizeQuestionText(literal);
    if (normalized.length >= 18) existing.set(normalized, 'database/seed.sql');
  }
  const batchesDir = resolve(sourceRoot, 'content/batches');
  for (const name of await readdir(batchesDir)) {
    if (!name.endsWith('.json') || name === `${batchId}.json`) continue;
    const candidate = JSON.parse(await readFile(resolve(batchesDir, name), 'utf8'));
    for (const subject of candidate.subjects ?? []) {
      for (const question of subject.questions ?? []) {
        const normalized = normalizeQuestionText(question.prompt);
        if (normalized) existing.set(normalized, `content/batches/${name}`);
      }
    }
  }
  return existing;
}

const existingContent = await collectExistingContent();
const duplicatePrompts = batch.subjects.flatMap((subject) => subject.questions)
  .map((question) => ({ id: question.id, source: existingContent.get(normalizeQuestionText(question.prompt)) }))
  .filter(({ source }) => source);
if (duplicatePrompts.length) {
  throw new Error(`Generated content duplicates existing rows:\n${duplicatePrompts.map(({ id, source }) => `${id}: ${source}`).join('\n')}`);
}

// --- SQL emission -----------------------------------------------------------
const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const topicId = (code) => topics.find(([topicCode]) => topicCode === code)[1];
const canonicalQuestionFields = [
  'topic_id', 'subject_id', 'exam_type_id', 'paper_type_id', 'past_paper_id',
  'question_text', 'question_type', 'round_type', 'options', 'correct_answer',
  'explanation', 'difficulty', 'points', 'marks', 'time_limit', 'question_number',
  'section', 'is_compulsory', 'image_url', 'syllabus_topic_id', 'command_word',
  'assessment_objective', 'source_paper_code', 'source_question_number', 'exam_board_id',
];

function questionValues(question) {
  return {
    topic_id: topicId(question.topicCode),
    subject_id: 'subj_wassce_social',
    exam_type_id: 'exam_wassce',
    paper_type_id: null,
    past_paper_id: null,
    question_text: question.prompt,
    question_type: question.type,
    round_type: null,
    options: question.options
      ? JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`))
      : null,
    correct_answer: question.correctAnswer,
    explanation: question.workedSolution,
    difficulty: question.difficulty,
    points: question.points,
    marks: question.marks,
    time_limit: question.timeLimit,
    question_number: null,
    section: null,
    is_compulsory: 1,
    image_url: null,
    syllabus_topic_id: null,
    command_word: question.commandWord,
    assessment_objective: question.assessmentObjective,
    source_paper_code: null,
    source_question_number: null,
    exam_board_id: 'board_waec',
  };
}

function canonicalMatch(alias, values) {
  return canonicalQuestionFields.map((field) => `${alias}.${field} IS ${sql(values[field])}`).join(' AND ');
}

function releaseMatch(alias) {
  return [
    `${alias}.batch_id IS '${batchId}'`,
    `${alias}.quality_assurance IS 'automated_beta'`,
    `${alias}.release_channel IS 'beta'`,
    `${alias}.content_label IS ${sql(contentLabel)}`,
    `${alias}.source_url IS ${sql(releaseSourceUrl)}`,
    `${alias}.official_exam_board_content IS 0`,
    `${alias}.feedback_enabled IS 1`,
  ].join(' AND ');
}

function assertWithinD1Limit(name, lines) {
  const crlf = `${lines.join('\n')}\n`.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
  const bytes = Buffer.byteLength(crlf + ledger, 'utf8');
  if (bytes >= 19_500) throw new Error(`${name} exceeds the remote D1 query limit (${bytes} bytes)`);
}

const outBatch = resolve(outputRoot, `content/batches/${batchId}.json`);
await mkdir(dirname(outBatch), { recursive: true });
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);

const migrationPaths = [];
async function emitMigration(name, lines) {
  assertWithinD1Limit(name, lines);
  const output = resolve(outputRoot, `database/migrations/${name}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${lines.join('\n')}\n`);
  migrationPaths.push(output);
}

let migrationNumber = 553;
{
  // Canonical topic rows: on prod and on fresh baselines (migration 366 creates
  // them with the same ids, names and slugs) every row already exists, so these
  // no-op. They exist so a scratch baseline without migration 366 still has the
  // bindings. The slugs match migration 366 exactly so a baseline that has only
  // some of the rows never trips the UNIQUE(subject_id, slug) constraint.
  const canonicalTopicRows = [
    ['topic_wassce_p2_soc_gov', 'Governance and democracy', 'Explain how constitutional provisions and institutions promote democratic governance in Ghana.', 'Governance in Ghana rests on the 1992 Constitution, which establishes the Executive, Legislature and Judiciary, guarantees fundamental human rights, and provides for checks and balances, the rule of law and an independent Electoral Commission.', '["Three arms of government: Executive, Legislature, Judiciary", "Presidential term: four years, renewable once", "Rule of law: no person is above the law"]', 1],
    ['topic_wassce_p2_soc_civ', 'Elections and civic life', 'Analyse threats to peaceful elections and propose civic solutions that protect the democratic process.', 'Civic life covers the rights and responsibilities of citizens: voting from age eighteen, paying taxes, obeying the law, and the work of the Electoral Commission and the NCCE in keeping elections free, fair and peaceful.', '["Voting age in Ghana: 18 years", "By-election: fills a seat vacant between general elections", "Referendum: a popular vote on one national question"]', 2],
    ['topic_wassce_p2_soc_med', 'Media and national development', 'Assess the roles the media play in education, accountability and national development.', 'The media inform, educate and entertain, act as a watchdog over those in power, and give citizens a platform for public discussion; misuse through fake news and bias can however incite conflict and slow development.', '["Media roles: inform, educate, entertain, watchdog", "Disinformation = false information spread with intent to deceive", "Ethics: accuracy, fairness, balance"]', 3],
    ['topic_wassce_p2_soc_mig', 'Population and migration', 'Evaluate the causes and consequences of rural-urban migration for sending and receiving communities.', 'Population studies cover the census, growth and structure of the population; migration is driven by push factors (rural poverty, few jobs) and pull factors (urban jobs and amenities), with effects on both sending and receiving areas.', '["Census interval: about every 10 years", "Push factors drive out; pull factors attract", "Dependency ratio = (young + elderly) ÷ working-age population"]', 4],
    ['topic_wassce_p2_soc_cul', 'Culture and globalization', 'Explain how Ghanaian cultural values can be preserved amid globalizing influences.', 'Culture is the total way of life of a people — material objects and non-material values, language and beliefs. Globalization spreads culture across borders, bringing both benefits and the risk of cultural erosion.', '["Culture = total way of life of a people", "Material culture = tangible objects; non-material = values and beliefs", "Cultural diffusion = spread of cultural traits between societies"]', 5],
    ['topic_wassce_p2_soc_edu', 'Adolescent health and education', 'Analyse the causes of teenage pregnancy and its consequences for girls\u2019 education and life chances.', 'Adolescence (10–19 years) brings puberty, peer pressure and health risks; abstinence, assertiveness, a balanced diet and avoiding substance abuse protect health and keep young people in school.', '["Adolescence: 10–19 years (WHO)", "Abstinence: the surest protection against STIs and pregnancy", "HIV is not spread by casual contact"]', 6],
    ['topic_wassce_p2_soc_eco', 'Agriculture and the economy', 'Explain the contribution of agriculture to employment, food security and industrial growth in Ghana.', 'Agriculture employs the largest share of Ghana\u2019s labour force, supplies food, earns foreign exchange through cocoa and other cash crops, and feeds raw materials to agro-processing industries.', '["Agriculture: largest employer in Ghana", "Cash crop: grown for sale/export, e.g. cocoa", "Agro-processing adds value to raw produce"]', 7],
    ['topic_wassce_p2_soc_env', 'Environment and illegal mining', 'Evaluate the environmental and social effects of illegal mining and the measures available to control it.', 'Illegal small-scale mining (galamsey) pollutes rivers with silt and mercury, destroys forests and farms, and leaves deadly pits; control requires firm law enforcement, regulated small-scale mining zones and land reclamation.', '["Galamsey = illegal small-scale gold mining", "Effects: river pollution, deforestation, mercury contamination", "Renewable resources regenerate; minerals do not"]', 8],
    ['topic_wassce_p2_soc_emp', 'Work and unemployment', 'Propose and assess measures government can take to reduce unemployment among the youth.', 'Unemployment means being willing and able to work but unable to find a job; it may be seasonal, structural, frictional or cyclical, and is reduced through skills training, entrepreneurship support and investment that creates jobs.', '["Unemployed = willing and able to work but jobless", "Seasonal unemployment follows the farming calendar", "Entrepreneur = opportunity spotter and risk bearer"]', 9],
  ];
  const allTopicIds = canonicalTopicRows.map(([id]) => id);
  const name = `${migrationNumber}_wassce_social_studies_sprint3_foundation.sql`;
  const lines = [
    `-- ${migrationNumber}: Foundation guard for WASSCE Social Studies sprint 3 beta batch (wassce-social-studies-sprint3-001).`,
    '-- Original BrillaPrep practice content; not official WAEC examination material.',
    '-- Re-asserts the prod-canonical topic rows for subj_wassce_social on scratch',
    '-- baselines; INSERT OR IGNORE no-ops on prod and on fresh baselines where the',
    '-- rows already exist (migration 366 created them with the same ids, names and slugs).',
    'PRAGMA foreign_keys = ON;',
    `INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, is_active, display_order) VALUES ('board_waec', 'WAEC', 'WAEC', 'West African Examinations Council', 'West Africa', 'https://waecgh.org/', 1, 1);`,
    `CREATE TABLE IF NOT EXISTS question_content_releases (
    question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    quality_assurance TEXT NOT NULL CHECK (quality_assurance IN ('automated_beta', 'human_reviewed')),
    release_channel TEXT NOT NULL CHECK (release_channel IN ('beta', 'production')),
    content_label TEXT NOT NULL,
    source_url TEXT NOT NULL,
    official_exam_board_content INTEGER NOT NULL DEFAULT 0 CHECK (official_exam_board_content IN (0, 1)),
    feedback_enabled INTEGER NOT NULL DEFAULT 1 CHECK (feedback_enabled IN (0, 1)),
    released_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
    'CREATE INDEX IF NOT EXISTS idx_question_content_releases_batch ON question_content_releases(batch_id);',
    ...canonicalTopicRows.map(([id, topicName, description, theoryContent, keyFormulas, displayOrder]) =>
      `INSERT OR IGNORE INTO topics (id, subject_id, parent_id, name, slug, description, theory_content, key_formulas, display_order, created_at) VALUES (${sql(id)}, 'subj_wassce_social', NULL, ${sql(topicName)}, ${sql(id.slice(6).replaceAll('_', '-'))}, ${sql(description)}, ${sql(theoryContent)}, ${sql(keyFormulas)}, ${displayOrder}, '2026-08-04T00:00:00.000Z');`),
    `CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM _migration_${migrationNumber}_guard;`,
    `INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM exam_types WHERE id = 'exam_wassce') AND EXISTS (SELECT 1 FROM exam_boards WHERE id = 'board_waec') AND EXISTS (SELECT 1 FROM subjects WHERE id = 'subj_wassce_social' AND exam_type_id = 'exam_wassce') AND (SELECT COUNT(*) FROM topics t JOIN subjects s ON s.id = t.subject_id WHERE t.id IN (${allTopicIds.map(sql).join(', ')}) AND t.subject_id = 'subj_wassce_social' AND s.exam_type_id = 'exam_wassce') = ${allTopicIds.length} THEN 1 ELSE 0 END;`,
    `DROP TABLE _migration_${migrationNumber}_guard;`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

const allQuestions = batch.subjects[0].questions;
const questionsPerPart = 4;
const partCount = Math.ceil(allQuestions.length / questionsPerPart);
for (let part = 1; part <= partCount; part += 1) {
  const partQuestions = allQuestions.slice((part - 1) * questionsPerPart, part * questionsPerPart);
  const ids = partQuestions.map((question) => question.id);
  const guardTable = `_migration_${migrationNumber}_guard`;
  const name = `${migrationNumber}_wassce_social_studies_sprint3_part_${part}.sql`;
  const lines = [
    `-- ${migrationNumber}: Original BrillaPrep WASSCE Social Studies sprint 3 beta questions, part ${part} of ${partCount} (batch wassce-social-studies-sprint3-001).`,
    '-- Curriculum-aligned practice content; not official WAEC examination material.',
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
  ];
  for (const question of partQuestions) {
    const values = questionValues(question);
    lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ${sql(question.id)} AND NOT (${canonicalMatch('q', values)})) AND NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ${sql(question.id)} AND NOT (${releaseMatch('r')})) THEN 1 ELSE 0 END;`);
  }
  for (const question of partQuestions) {
    const values = questionValues(question);
    lines.push(`INSERT OR IGNORE INTO questions (id, ${canonicalQuestionFields.join(', ')}) VALUES (${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')});`);
  }
  lines.push(`INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, '${batchId}', 'automated_beta', 'beta', ${sql(contentLabel)}, ${sql(releaseSourceUrl)}, 0, 1 FROM questions WHERE id IN (${ids.map(sql).join(', ')});`);
  lines.push(`DELETE FROM ${guardTable};`);
  lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id IN (${ids.map(sql).join(', ')})) = ${ids.length} AND (SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (${ids.map(sql).join(', ')}) AND ${releaseMatch('r')}) = ${ids.length} THEN 1 ELSE 0 END;`);
  lines.push(`DROP TABLE ${guardTable};`);
  await emitMigration(name, lines);
  migrationNumber += 1;
}

{
  const allIds = allQuestions.map((question) => question.id);
  const easyCount = allQuestions.filter((question) => question.difficulty === 'easy').length;
  const mediumCount = allQuestions.filter((question) => question.difficulty === 'medium').length;
  const name = `${migrationNumber}_wassce_social_studies_sprint3_final_guard.sql`;
  const guardTable = `_migration_${migrationNumber}_guard`;
  const lines = [
    `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE Social Studies sprint 3 beta batch (wassce-social-studies-sprint3-001).`,
    'PRAGMA foreign_keys = ON;',
    `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
    `DELETE FROM ${guardTable};`,
    `INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = 'subj_wassce_social' AND q.exam_type_id = 'exam_wassce' AND q.exam_board_id = 'board_waec' AND q.round_type IS NULL AND length(q.explanation) >= 80 AND r.batch_id = '${batchId}' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = ${allIds.length} AND (SELECT COUNT(*) FROM questions q WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A', 'B', 'C', 'D') AND q.points = 1 AND q.marks = 1 AND q.time_limit = 90) = ${allIds.length} AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = '${batchId}') = ${allIds.length} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'easy') = ${easyCount} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'medium') = ${mediumCount} AND (SELECT COUNT(*) FROM questions WHERE id IN (${allIds.map(sql).join(', ')}) AND difficulty = 'hard') = 0 THEN 1 ELSE 0 END;`,
    `DROP TABLE ${guardTable};`,
  ];
  await emitMigration(name, lines);
  migrationNumber += 1;
}

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
