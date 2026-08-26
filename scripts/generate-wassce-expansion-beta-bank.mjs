import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeQuestionText, validateQuestionBatch } from './question-content-lib.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) throw new Error('--output-root requires a path');
const outputRoot = outputRootArgument >= 0 ? resolve(process.argv[outputRootArgument + 1]) : sourceRoot;
const generatedAt = '2026-08-26T00:00:00Z';
const labels = ['A', 'B', 'C', 'D'];
const difficulties = ['easy', 'medium', 'hard'];
const assessmentObjectives = ['AO1', 'AO2', 'AO3'];

const item = (topicCode, prompt, correct, wrong, explanation) => ({ topicCode, prompt, correct, wrong, explanation });

const islamic = {
  key: 'irs',
  subjectId: 'subj_wassce_irs',
  specId: 'spec_wassce_irs_brilla_b001',
  specificationCode: 'BRILLA-WASSCE-IRS-BETA-001',
  syllabusName: 'BrillaPrep IRS beta content blueprint',
  releaseSourceUrl: 'https://waecgh.org/home/wassce-school/',
  assessmentInfo: 'Internal BrillaPrep evidence blueprint for a current WASSCE subject. It does not claim an official syllabus code, validity date or paper structure.',
  sources: [
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates subject catalogue', url: 'https://waecgh.org/home/wassce-school/' },
    { publisher: 'West African Examinations Council', title: 'Islamic Studies e-learning index', url: 'https://www.waeconline.org.ng/e-learning/Islamic/IRKmain.html' },
  ],
  contentLabel: 'Original BrillaPrep practice content aligned to published WAEC Islamic Studies learning evidence; not official WAEC examination material.',
  topics: [
    ['IRS-1', 'The Qur’an and revelation', 'Explain revelation, preservation, structure and selected moral teachings of the Qur’an.'],
    ['IRS-2', 'Hadith and Sunnah', 'Distinguish Hadith and Sunnah and explain authentication, classification and major collections.'],
    ['IRS-3', 'Life of Prophet Muhammad', 'Explain major events in the Prophet’s life and lessons from Makkah and Madinah.'],
    ['IRS-4', 'Beliefs and pillars of Islam', 'Apply the articles of faith and Five Pillars to Muslim belief and conduct.'],
    ['IRS-5', 'Worship and purification', 'Explain purification, prayer, fasting and lawful concessions in worship.'],
    ['IRS-6', 'Shari’ah, family and community life', 'Explain sources and purposes of Shari’ah and principles for responsible family and community life.'],
    ['IRS-7', 'Early Islamic leadership and scholarship', 'Evaluate leadership and contributions to preservation, administration and scholarship in early Islam.'],
    ['IRS-8', 'Islamic ethics and social responsibility', 'Apply Islamic moral teachings to justice, care, honesty, peace and stewardship.'],
  ],
  facts: [
    item('IRS-1', 'What does wahy mean in the context of the Qur’an?', 'Divine revelation communicated by Allah to a prophet', ['A private opinion of a historian', 'Any poem written in Arabic', 'A ruling made only by a merchant'], 'Wahy refers to divine communication to prophets. Muslims believe the Qur’an was revealed to Prophet Muhammad through the angel Jibril.'),
    item('IRS-1', 'Which caliph initiated the first official collection of the Qur’an into one compilation after many reciters died?', 'Abu Bakr', ['Uthman ibn Affan', 'Umar ibn Abd al-Aziz', 'Ali ibn Abi Talib'], 'Abu Bakr authorised the collection after the Battle of Yamamah, with Zayd ibn Thabit leading the careful compilation work.'),
    item('IRS-1', 'Why did Caliph Uthman distribute standard copies of the Qur’an?', 'To preserve unity in recitation and prevent disputes over written forms', ['To add new chapters', 'To translate the text into only one local language', 'To replace memorisation with trade records'], 'As Islam spread, differences in recitation practice risked dispute. Standard copies based on the established compilation protected textual unity.'),
    item('IRS-1', 'What central moral duty appears in Qur’an 17:23 alongside worshipping Allah alone?', 'Showing kindness and respect to parents', ['Avoiding all lawful work', 'Refusing hospitality to travellers', 'Keeping knowledge secret'], 'The passage joins monotheism with excellent treatment of parents, especially patience, respectful speech and care when they are old.'),
    item('IRS-1', 'What is a surah in the Qur’an?', 'A chapter of the Qur’an', ['A transmitter in a Hadith chain', 'A voluntary charity only', 'A school of architecture'], 'The Qur’an is organised into chapters called suwar, each containing verses called ayat and identified by an established name.'),

    item('IRS-2', 'What is the isnad of a Hadith?', 'The chain of people who transmitted the report', ['The main mosque of a city', 'The legal ruling derived from trade', 'The written chapter heading'], 'Hadith scholars examine the isnad to identify transmitters and assess continuity and reliability alongside analysis of the reported text.'),
    item('IRS-2', 'What is the matn of a Hadith?', 'The actual reported wording or content', ['The chain of transmitters', 'A tax on agricultural produce', 'The direction of prayer'], 'A Hadith has a chain of transmission and a reported text. Both require examination when scholars assess authenticity and meaning.'),
    item('IRS-2', 'Which description best fits a sahih Hadith?', 'A report meeting strong conditions of continuity and reliable transmission', ['Every story circulated without a chain', 'A report known to contain a fabricated narrator', 'Any statement that agrees with personal preference'], 'Sahih classification depends on connected transmission, trustworthy precise narrators and freedom from disqualifying irregularity or hidden defect.'),
    item('IRS-2', 'How does Sunnah differ from an individual Hadith report?', 'Sunnah is the Prophet’s normative example, while Hadith reports transmit information about it', ['Sunnah is a chapter of the Qur’an', 'Hadith is always later custom with no chain', 'The two terms refer only to buildings'], 'Hadith is a vehicle through which sayings, actions and approvals are reported, while Sunnah describes the Prophetic model followed in Muslim life.'),
    item('IRS-2', 'Why was Umar ibn Abd al-Aziz important in Hadith history?', 'He ordered scholars to collect Hadith before knowledge and transmitters were lost', ['He prohibited all written scholarship', 'He replaced the Qur’an with biographies', 'He was the first caller to prayer in Makkah'], 'His official encouragement helped move Hadith collection toward organised preservation at a time when knowledgeable transmitters were disappearing.'),

    item('IRS-3', 'What does Hijrah refer to in the Prophet’s life?', 'The migration from Makkah to Madinah', ['The first revelation at Hira', 'The rebuilding of the Ka’bah before prophethood', 'The farewell sermon at Arafah'], 'The Hijrah established a secure Muslim community in Madinah and marks the starting point used for the Islamic lunar calendar.'),
    item('IRS-3', 'What was a key lesson of the brotherhood formed between the Muhajirun and Ansar?', 'Community solidarity can overcome displacement and social division', ['Tribal status must determine all rights', 'Migrants should remain permanently isolated', 'Wealth should never be shared'], 'The pairing supported displaced Makkan Muslims and strengthened mutual responsibility in the new Madinan community.'),
    item('IRS-3', 'Why was the Treaty of Hudaybiyyah strategically important?', 'A period of peace created wider opportunities for contact and peaceful propagation', ['It ended every later disagreement immediately', 'It required Muslims to abandon Madinah', 'It prohibited all future pilgrimage'], 'Although some terms initially seemed difficult, the truce reduced conflict and allowed communication that contributed to rapid community growth.'),
    item('IRS-3', 'What happened during the first revelation?', 'The angel Jibril commanded the Prophet to read or recite', ['The Prophet was crowned king of Makkah', 'The Qur’an was printed as a complete book', 'The Ka’bah was moved to Madinah'], 'Islamic tradition records that the first verses of Surah al-Alaq were revealed through Jibril while the Prophet was in the cave of Hira.'),
    item('IRS-3', 'Which quality did the title al-Amin recognise in Muhammad before prophethood?', 'Trustworthiness', ['Military rank', 'Ownership of every caravan', 'Authority as a Roman governor'], 'People in Makkah recognised Muhammad as trustworthy and dependable, a character quality central to his later mission and leadership.'),

    item('IRS-4', 'What does tawhid mean in Islamic belief?', 'Belief in the absolute oneness of Allah', ['Worship of several independent deities', 'Rejection of all prophets', 'A method of commercial accounting'], 'Tawhid is the foundation of Islamic belief: Allah alone is the creator and deserves worship without partners or rivals.'),
    item('IRS-4', 'Which is one of the Five Pillars of Islam?', 'Zakah', ['Tribal superiority', 'Monastic isolation', 'Fortune telling'], 'Zakah is obligatory almsgiving on qualifying wealth and links worship with purification of wealth and responsibility toward eligible recipients.'),
    item('IRS-4', 'What is the primary declaration contained in the Shahadah?', 'There is no deity worthy of worship except Allah and Muhammad is His messenger', ['Every nation must use one language', 'Wealth determines spiritual rank', 'Only scholars are accountable for conduct'], 'The testimony expresses monotheism and acceptance of Muhammad’s prophethood, forming the verbal foundation of Muslim commitment.'),
    item('IRS-4', 'What does belief in qadar affirm?', 'Allah’s knowledge and decree while humans remain responsible for chosen actions', ['Human beings have no moral accountability', 'Planning for the future is forbidden', 'Natural causes never operate'], 'Belief in divine decree encourages trust in Allah without cancelling effort, choice, planning or accountability for deliberate conduct.'),
    item('IRS-4', 'Who are the messengers in Islamic belief?', 'Human beings chosen by Allah to convey guidance', ['Angels who became human permanently', 'Rulers selected only by wealth', 'Authors of every historical book'], 'Muslims believe Allah selected messengers from humanity, gave them revelation and made them models of faithful conduct.'),

    item('IRS-5', 'When is tayammum permitted?', 'When water is unavailable or its use would cause genuine harm', ['Whenever a person wishes to avoid all preparation', 'Only after completing the prayer', 'When clean water is freely available and safe'], 'Tayammum is a lawful dry purification using clean earth under recognised necessity; it is not a convenience that replaces usable water without cause.'),
    item('IRS-5', 'Which prayer is performed in congregation on Friday in place of the normal midday prayer for those obligated to attend?', 'Jumu’ah', ['Tahajjud', 'Witr', 'Janazah'], 'Jumu’ah includes a sermon and congregational prayer and has special communal significance in weekly Muslim worship.'),
    item('IRS-5', 'What is the purpose of wudu before prayer?', 'Ritual purification and readiness for worship', ['A substitute for every ethical duty', 'A guarantee that no mistake can occur', 'A method of calculating Zakah'], 'Wudu uses prescribed washing to prepare for prayer, joining physical cleanliness with conscious spiritual readiness.'),
    item('IRS-5', 'During which month is the obligatory fast observed?', 'Ramadan', ['Muharram only', 'Rabi al-Awwal', 'Dhu al-Qadah'], 'Fasting Ramadan is a pillar of Islam and trains self-restraint, gratitude, devotion and awareness of people in need.'),
    item('IRS-5', 'What is the qiblah?', 'The direction of the Ka’bah faced during prayer', ['The sermon delivered after every meal', 'The charity due on crops', 'The chain of a Hadith'], 'Facing the qiblah unifies worshippers in direction while prayer remains directed to Allah rather than to the building itself.'),

    item('IRS-6', 'Which two primary sources form the foundation of Shari’ah?', 'The Qur’an and Sunnah', ['Local rumour and personal desire', 'Trade records and poetry alone', 'Astronomy and architecture'], 'Islamic law begins with the Qur’an and authenticated Prophetic Sunnah, with disciplined methods used for matters requiring further interpretation.'),
    item('IRS-6', 'What is ijma in Islamic legal reasoning?', 'Qualified scholarly consensus on a matter', ['A private dream treated as public law', 'Any custom even when it contradicts revelation', 'A commercial partnership deed'], 'Ijma refers to recognised consensus among qualified scholars and is treated within legal theory as a source after the foundational texts.'),
    item('IRS-6', 'What is qiyas in Islamic legal reasoning?', 'Reasoning by analogy from an established ruling and its effective cause', ['Replacing revelation with personal preference', 'Memorising a chapter without understanding', 'Cancelling every earlier judgment'], 'Qiyas applies a known rule to a new case that shares the relevant underlying cause, using disciplined rather than arbitrary comparison.'),
    item('IRS-6', 'What should guide custody decisions concerning a child after family separation?', 'The child’s welfare within applicable Islamic and lawful responsibilities', ['Using the child to punish the other parent', 'Ignoring care, safety and development', 'Awarding custody solely by wealth'], 'Al-hadanah concerns care and upbringing. Responsible decisions protect the child’s welfare and rights rather than treating custody as retaliation.'),
    item('IRS-6', 'Why is a marriage contract important in Islam?', 'It establishes a lawful union with recognised mutual rights and responsibilities', ['It removes the need for free consent', 'It permits concealment of agreed obligations', 'It makes kindness between spouses optional'], 'Nikah is a serious covenant requiring consent and defined responsibilities, including dignity, support and fair treatment within the marriage.'),

    item('IRS-7', 'What title is commonly given to Abu Bakr as the first caliph?', 'Al-Siddiq', ['Al-Faruq', 'Dhu al-Nurayn', 'Saifullah'], 'Abu Bakr was known as al-Siddiq, reflecting his truthfulness and steadfast affirmation of the Prophet.'),
    item('IRS-7', 'Which caliph is especially associated with organising provinces and public administration as the state expanded?', 'Umar ibn al-Khattab', ['Abu Lahab', 'Abu Jahl', 'Walid ibn al-Mughira'], 'Umar developed administrative, judicial and welfare arrangements and was known for accountability as Muslim territories expanded.'),
    item('IRS-7', 'Why is Uthman ibn Affan called Dhu al-Nurayn?', 'He married two daughters of Prophet Muhammad in succession', ['He led two migrations in the same day', 'He compiled two different Qur’ans', 'He built two Ka’bahs'], 'The title means possessor of the two lights and refers to his marriages to Ruqayyah and, after her death, Umm Kulthum.'),
    item('IRS-7', 'Which contribution is strongly associated with Ali ibn Abi Talib?', 'Knowledge, courage and close service to the Prophet', ['Opposition to the first revelation', 'Rule as a Byzantine emperor', 'Prohibition of learning'], 'Ali was among the earliest Muslims, was raised close to the Prophet and became known for learning, judgment and courage.'),
    item('IRS-7', 'Why did Muslim scholars develop detailed narrator criticism?', 'To distinguish reliable reports from weak or fabricated ones', ['To prevent any Hadith from being studied', 'To judge people only by their wealth', 'To replace the Qur’an with genealogy'], 'Biographical and transmission analysis protected religious knowledge by checking memory, integrity, chronology and opportunities for narrators to meet.'),

    item('IRS-8', 'What does amanah require in business dealings?', 'Trustworthiness and faithful discharge of responsibility', ['Concealing defects from buyers', 'Changing agreed measures secretly', 'Breaking promises whenever profit increases'], 'Amanah requires honesty with property, information and obligations, making it central to trustworthy trade and public responsibility.'),
    item('IRS-8', 'What social purpose does Zakah serve?', 'Purifying qualifying wealth and supporting eligible people and causes', ['Increasing inequality as an objective', 'Replacing every voluntary good deed', 'Funding only luxury consumption'], 'Zakah combines worship with structured social support and reminds owners that wealth carries duties toward the wider community.'),
    item('IRS-8', 'Which conduct best reflects adl?', 'Acting justly even when personal interest points elsewhere', ['Favouring relatives regardless of evidence', 'Using different measures for buyers and sellers', 'Withholding every worker’s agreed wage'], 'Adl means justice and fairness. Islamic ethics require consistent standards and protection of rights rather than biased advantage.'),
    item('IRS-8', 'How should disagreement be handled according to Islamic ethics?', 'With evidence, respectful speech and a sincere search for reconciliation', ['With insults and deliberate falsehood', 'By assuming every opponent is dishonest', 'By spreading unverified accusations'], 'Truthfulness, restraint and peacemaking protect dignity and make resolution more likely even when the parties continue to disagree.'),
    item('IRS-8', 'What does stewardship of the earth imply?', 'People should use resources responsibly and avoid waste and harm', ['Natural resources have no moral value', 'Waste is acceptable when ownership is private', 'Future generations have no interests'], 'The idea of khalifah frames human power as accountable stewardship, encouraging beneficial use, moderation and protection from corruption or needless damage.'),
  ],
};

const electricity = {
  key: 'elect',
  subjectId: 'subj_wassce_elect_app',
  specId: 'spec_wassce_elect_app_brilla_b001',
  specificationCode: 'BRILLA-WASSCE-AEL-BETA-001',
  syllabusName: 'BrillaPrep transitional Applied Electricity beta content blueprint',
  releaseSourceUrl: 'https://waecgh.org/wp-content/uploads/2026/03/FINAL-TIMETABLE-FOR-WASSCE-SC-2026-GHANA-ONLY-NEW-TAD.pdf',
  assessmentInfo: 'Internal BrillaPrep evidence blueprint for the outgoing Applied Electricity track examined during Ghana curriculum transition. New-curriculum learners use Applied Technology III (Electrical and Electronic Technology).',
  sources: [
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates 2026 final timetable', url: 'https://waecgh.org/wp-content/uploads/2026/03/FINAL-TIMETABLE-FOR-WASSCE-SC-2026-GHANA-ONLY-NEW-TAD.pdf' },
    { publisher: 'National Council for Curriculum and Assessment, Ghana', title: 'Applied Technology Curriculum', url: 'https://nacca.gov.gh/wp-content/uploads/2025/04/Applied-Technology-Curriculum.pdf' },
    { publisher: 'West African Examinations Council, Ghana', title: 'Applied Electricity chief examiner evidence', url: 'https://waecgh.org/wp-content/uploads/2023/12/Technical17.pdf' },
  ],
  contentLabel: 'Original BrillaPrep transitional Applied Electricity practice; not official WAEC examination material and not the new Applied Technology III bank.',
  topics: [
    ['AEL-1', 'Electrical safety and quantities', 'Apply electrical safety and explain charge, current, voltage, resistance, power, energy and their units.'],
    ['AEL-2', 'Direct-current circuits', 'Analyse series, parallel and mixed direct-current circuits using circuit laws.'],
    ['AEL-3', 'Capacitance and alternating current', 'Explain capacitance and analyse basic alternating-current quantities, reactance, impedance and power factor.'],
    ['AEL-4', 'Magnetism and transformers', 'Apply electromagnetic principles to coils, induction and transformer operation.'],
    ['AEL-5', 'Electrical machines and generation', 'Explain operating principles and applications of generators and motors.'],
    ['AEL-6', 'Electrical instruments and measurement', 'Select and connect instruments safely to measure common electrical quantities.'],
    ['AEL-7', 'Semiconductor electronics', 'Explain diodes, transistors, rectification, switching and basic electronic circuits.'],
    ['AEL-8', 'Installation, protection and distribution', 'Apply wiring, earthing, protection and electrical supply-distribution principles.'],
  ],
  facts: [
    item('AEL-1', 'What should be done first before working on a mains electrical circuit?', 'Isolate the supply and verify that the circuit is de-energised', ['Touch a conductor to test it by sensation', 'Replace the fuse while current is flowing', 'Assume an open switch guarantees isolation'], 'Safe isolation requires disconnection, prevention of unintended reconnection and verification with suitable test equipment before conductors are handled.'),
    item('AEL-1', 'A current meter reads 2.5 A. Which SI base unit is represented by the symbol A?', 'Ampere', ['Volt', 'Ohm', 'Watt'], 'Current is the rate of flow of electric charge and is measured in amperes, while voltage, resistance and power use different units.'),
    item('AEL-1', 'A 12 V device draws 2 A. What electrical power does it use?', '24 W', ['6 W', '10 W', '48 W'], 'Electrical power in a direct-current resistive load is P = VI, so 12 multiplied by 2 gives 24 watts.'),
    item('AEL-1', 'What does resistance describe?', 'Opposition to electric current flow', ['The rate of using electrical energy only', 'The amount of charge stored in every source', 'The magnetic direction of a compass'], 'Resistance relates voltage to current and is measured in ohms; material, length, cross-sectional area and temperature can affect it.'),
    item('AEL-1', 'Why must a person avoid using water on energised electrical equipment?', 'Water can create conductive paths and increase shock or fault risk', ['Water always raises insulation resistance', 'It safely isolates every live conductor', 'It guarantees that protective devices cannot operate'], 'Ordinary water and contaminants may conduct current, exposing people and equipment to shock, short-circuit and arc hazards.'),

    item('AEL-2', 'Two resistors of 4 Ω and 6 Ω are connected in series. What is their total resistance?', '10 Ω', ['2.4 Ω', '5 Ω', '24 Ω'], 'Series resistances add because the same current passes through each component, giving 4 plus 6 equals 10 ohms.'),
    item('AEL-2', 'What quantity is the same through all components in a series circuit?', 'Current', ['Voltage across each component', 'Resistance of each component', 'Power used by each component'], 'A series path has no branch, so the same current flows through every component while supply voltage is divided among them.'),
    item('AEL-2', 'Two identical resistors are connected in parallel. How does their equivalent resistance compare with one resistor?', 'It is half the resistance of one resistor', ['It is twice the resistance', 'It is unchanged', 'It is zero for every resistor value'], 'For two equal parallel resistors, conductances add, producing an equivalent resistance R divided by 2.'),
    item('AEL-2', 'What does Kirchhoff’s current law state at a junction?', 'Total current entering equals total current leaving', ['All branch voltages must be zero', 'Resistance is independent of material', 'Power can be created at a junction'], 'The law follows conservation of charge: charge cannot continually accumulate at an ideal circuit node.'),
    item('AEL-2', 'A 6 Ω resistor carries 3 A. What is the voltage across it?', '18 V', ['2 V', '9 V', '36 V'], 'Ohm’s law gives V = IR. Multiplying 3 amperes by 6 ohms gives a potential difference of 18 volts.'),

    item('AEL-3', 'What does a capacitor store?', 'Electric charge and energy in an electric field', ['A continuous supply of fuel', 'Only magnetic poles', 'Mechanical torque without a field'], 'Separated conductors and a dielectric allow charge to accumulate, with energy stored in the electric field between them.'),
    item('AEL-3', 'A capacitor is marked 470 µF. Which named SI unit does the letter F represent?', 'Farad', ['Henry', 'Weber', 'Tesla'], 'Capacitance is charge stored per unit potential difference and is measured in farads, commonly expressed in microfarads or smaller units.'),
    item('AEL-3', 'How does capacitive reactance change when frequency increases?', 'It decreases', ['It increases linearly', 'It remains constant', 'It becomes resistance only'], 'Capacitive reactance is Xc = 1 divided by 2πfC, so higher frequency produces less opposition from a given capacitor.'),
    item('AEL-3', 'What is impedance in an alternating-current circuit?', 'The combined opposition of resistance and reactance', ['The direct-current charge of a battery', 'Only the physical size of a conductor', 'Power multiplied by time'], 'Impedance accounts for resistance and frequency-dependent reactance and is represented in ohms, often with magnitude and phase.'),
    item('AEL-3', 'Why is a high power factor generally desirable for an AC load?', 'It reduces current required for a given real power', ['It makes voltage and frequency irrelevant', 'It eliminates all energy loss', 'It causes every load to become capacitive'], 'When power factor is closer to unity, less current is needed to deliver the same useful power, reducing conductor and system losses.'),

    item('AEL-4', 'A compass is placed beside a straight wire and deflects when the wire is energised. What produced the deflection?', 'A magnetic field is produced', ['Its resistance must become zero', 'All nearby metals become permanent magnets', 'Voltage can no longer be measured'], 'Moving electric charge produces a magnetic field whose direction around a straight conductor follows the right-hand grip rule.'),
    item('AEL-4', 'A coil is moved through a magnetic field and a voltmeter briefly deflects. Which process produced the emf?', 'Production of an emf when magnetic flux linkage changes', ['Creation of energy without a source', 'Permanent charging of every iron core', 'Conversion of resistance directly into mass'], 'Faraday’s law relates induced emf to the rate of change of magnetic flux linkage through a circuit.'),
    item('AEL-4', 'Why is a transformer core laminated?', 'To reduce eddy-current losses', ['To increase winding resistance deliberately', 'To stop magnetic flux entirely', 'To convert AC directly into DC'], 'Thin insulated laminations interrupt circulating currents in the core, reducing heating and wasted power.'),
    item('AEL-4', 'An ideal transformer has 100 primary turns and 20 secondary turns with 240 V applied. What is the secondary voltage?', '48 V', ['12 V', '120 V', '1200 V'], 'For an ideal transformer, Vs divided by Vp equals Ns divided by Np. Thus 240 multiplied by 20 over 100 equals 48 volts.'),
    item('AEL-4', 'Why does a transformer require a changing magnetic flux?', 'A changing flux is needed to induce emf in the secondary winding', ['Steady DC automatically produces continuous secondary voltage', 'Flux must remain zero for energy transfer', 'The core supplies unlimited electrical energy'], 'Mutual induction depends on changing flux linkage, which is why ordinary transformers operate with alternating rather than steady direct current.'),

    item('AEL-5', 'What energy conversion occurs in an electric motor?', 'Electrical energy to mechanical energy', ['Mechanical energy to electrical energy', 'Thermal energy to nuclear energy', 'Chemical energy directly to light only'], 'Motor conductors carrying current in a magnetic field experience force, producing torque and mechanical output.'),
    item('AEL-5', 'What energy conversion occurs in a generator?', 'Mechanical energy to electrical energy', ['Electrical energy to stored chemical energy only', 'Light energy to mass', 'Resistance to magnetic charge'], 'A prime mover changes magnetic flux linkage with windings, inducing an emf and converting mechanical input to electrical output.'),
    item('AEL-5', 'What is the function of the split-ring commutator in a simple DC motor?', 'Reverse armature current each half-turn to maintain torque direction', ['Increase supply frequency', 'Store charge like a capacitor', 'Disconnect the magnetic field permanently'], 'The commutator changes current direction relative to the field so the forces continue to turn the armature in the same rotational direction.'),
    item('AEL-5', 'Why is a starter used with many motors?', 'To limit excessive starting current and provide control or protection', ['To remove the need for a supply', 'To make the rotor weightless', 'To prevent every mechanical fault'], 'At start, back emf may be low and current high. A starter controls energisation and can add overload or undervoltage protection.'),
    item('AEL-5', 'What mainly determines the synchronous speed of an AC machine?', 'Supply frequency and number of poles', ['Only the colour of the windings', 'Bearing diameter alone', 'Insulation resistance only'], 'Synchronous speed follows 120 times frequency divided by pole count, so higher pole count lowers speed at a fixed frequency.'),

    item('AEL-6', 'How should an ammeter be connected to measure circuit current?', 'In series with the circuit branch', ['In parallel across the supply', 'Across an open switch only', 'Without completing a current path'], 'An ammeter must carry the branch current and has low internal resistance, so parallel connection could create a dangerous high current.'),
    item('AEL-6', 'How should a voltmeter be connected?', 'In parallel across the two points', ['In series with every load', 'Directly across a current transformer secondary left open', 'Only to earth with no second lead'], 'A voltmeter measures potential difference and has high internal resistance, so it is connected across the component or points of interest.'),
    item('AEL-6', 'What does a continuity test determine?', 'Whether a low-resistance conducting path exists', ['The exact power factor of a live installation', 'The colour code of every cable', 'The future lifetime of a motor'], 'With the circuit safely isolated, a continuity test checks whether conductors and connections form an unbroken path.'),
    item('AEL-6', 'Why must resistance normally be measured on a de-energised circuit?', 'The meter supplies its own test current and external voltage can damage it or mislead the reading', ['Resistance exists only when power is off', 'An ohmmeter generates mains voltage', 'Isolation makes every resistance zero'], 'Ohmmeters use an internal source; applying them to live circuits creates unsafe conditions and invalid or damaging current paths.'),
    item('AEL-6', 'What is the purpose of an insulation-resistance test?', 'Assess resistance between conductors and earth or other conductors', ['Measure rotational speed', 'Set the supply frequency', 'Determine the price of electricity'], 'High insulation resistance indicates that unintended leakage paths are limited, while low readings may identify moisture, damage or contamination.'),

    item('AEL-7', 'What is the main property of a semiconductor diode?', 'It conducts readily in one direction and blocks in the other within ratings', ['It amplifies without any bias or supply', 'It has zero resistance in both directions', 'It stores mechanical energy'], 'A p-n junction diode permits forward current after its characteristic threshold and restricts reverse current until breakdown conditions.'),
    item('AEL-7', 'What is the purpose of a rectifier?', 'Convert alternating current into unidirectional current', ['Increase mechanical speed', 'Convert DC into sound only', 'Measure insulation resistance'], 'Diodes arranged as half-wave or full-wave rectifiers steer alternating input so the load current has one principal direction.'),
    item('AEL-7', 'In a bipolar junction transistor, which terminal controls a much larger collector current?', 'Base', ['Case', 'Heat sink', 'Insulator'], 'A relatively small base current controls collector-emitter current in the active or switching operating regions of a BJT.'),
    item('AEL-7', 'What is the function of a smoothing capacitor after a rectifier?', 'Reduce ripple in the rectified output voltage', ['Increase ripple deliberately', 'Block all direct current to the load', 'Create magnetic rotation'], 'The capacitor charges near voltage peaks and releases energy between them, reducing variations in the unregulated DC output.'),
    item('AEL-7', 'What operating state is intended when a transistor is used as a closed electronic switch?', 'Saturation', ['Cut-off', 'Reverse breakdown', 'Open-circuit bias only'], 'In saturation the transistor conducts strongly with a small collector-emitter voltage, while cut-off represents the open-switch state.'),

    item('AEL-8', 'What is the main safety purpose of protective earthing?', 'Provide a low-impedance fault path so protection disconnects exposed metal', ['Make all conductors carry normal load current through earth', 'Increase touch voltage during a fault', 'Replace overcurrent protection'], 'Earthing connects exposed conductive parts so a fault current can operate protective devices quickly and limit dangerous touch voltage.'),
    item('AEL-8', 'A correctly rated fuse melts during a sustained overcurrent. What protective action has it performed?', 'Open the circuit when current exceeds its safe value for sufficient time', ['Maintain current regardless of faults', 'Increase conductor temperature', 'Act as a normal on-off control switch'], 'A fuse element melts under excessive current, interrupting the circuit to reduce damage and fire risk when correctly rated and installed.'),
    item('AEL-8', 'Which device is designed to detect an imbalance between line and neutral currents?', 'Residual current device', ['Energy meter', 'Step-up transformer', 'Series resistor'], 'An RCD compares outgoing and returning current and disconnects when leakage exceeds its trip threshold, supplementing other protection.'),
    item('AEL-8', 'Why is electrical power transmitted at high voltage?', 'Higher voltage permits lower current and lower I²R loss for the same power', ['High voltage makes conductors have no resistance', 'It removes the need for insulation', 'It makes transformers unnecessary'], 'For a given power, raising voltage lowers current, and resistive line loss falls with the square of current, subject to insulation and equipment requirements.'),
    item('AEL-8', 'In Ghana’s nominal 400/230 V low-voltage system, what voltage is supplied between one phase and neutral?', 'About 230 V', ['About 400 V', 'About 11 kV', 'Exactly 0 V'], 'Ghana’s nominal low-voltage distribution levels are 400 V phase-to-phase and 230 V phase-to-neutral, so a single-phase consumer receives about 230 V.'),
  ],
};

const subjects = [islamic, electricity];

function mcq(subjectKey, index, source) {
  const correctIndex = index % 4;
  const rawOptions = [...source.wrong];
  rawOptions.splice(correctIndex, 0, source.correct);
  const options = rawOptions.map((text, optionIndex) => ({
    label: labels[optionIndex],
    text,
    rationale: optionIndex === correctIndex
      ? `This is the supported answer. ${source.explanation}`
      : 'This option is a plausible misconception, but it does not follow the principle established in the worked solution.',
  }));
  return {
    id: `q_was_${subjectKey}_b001_${String(index + 1).padStart(3, '0')}`,
    original: true,
    topicCode: source.topicCode,
    type: 'multiple_choice',
    prompt: source.prompt,
    options,
    correctAnswer: labels[correctIndex],
    workedSolution: `${source.explanation} Therefore the correct answer is ${labels[correctIndex]}: ${source.correct}.`,
    difficulty: difficulties[index % difficulties.length],
    marks: index % 5 === 4 ? 3 : index % 2 === 0 ? 1 : 2,
    commandWord: /why|how/i.test(source.prompt) ? 'Explain' : /what|which|who|when/i.test(source.prompt) ? 'Identify' : 'Apply',
    assessmentObjective: assessmentObjectives[index % assessmentObjectives.length],
  };
}

const batch = {
  batchId: 'wassce-expansion-beta-001',
  status: 'approved_for_production',
  examTypeId: 'exam_wassce',
  provenance: subjects.flatMap((subject) => subject.sources.map((source) => ({
    publisher: source.publisher,
    title: source.title,
    url: source.url,
    use: 'curriculum_blueprint_only',
  }))),
  review: { authoringMethod: 'original_curriculum_aligned', qualityAssurance: 'automated_beta', automatedChecksAt: generatedAt },
  release: {
    channel: 'beta',
    contentLabel: 'Original BrillaPrep curriculum-aligned practice content; not official WAEC examination material.',
    officialExamBoardContent: false,
    feedbackEnabled: true,
  },
  subjects: subjects.map((subject) => ({
    subjectId: subject.subjectId,
    specificationCode: subject.specificationCode,
    topics: subject.topics.map(([code, title, objective]) => ({ code, title, objective })),
    questions: subject.facts.map((source, index) => mcq(subject.key, index, source)),
  })),
};

async function collectExistingPrompts() {
  const existing = new Map();
  const seedSql = await readFile(resolve(sourceRoot, 'database/seed.sql'), 'utf8');
  for (const match of seedSql.matchAll(/'(?:''|[^'])*'/g)) {
    const literal = match[0].slice(1, -1).replaceAll("''", "'");
    const normalized = normalizeQuestionText(literal);
    if (normalized.length >= 18) existing.set(normalized, 'database/seed.sql');
  }
  const batchesDir = resolve(sourceRoot, 'content/batches');
  for (const name of await readdir(batchesDir)) {
    if (!name.endsWith('.json') || name === 'wassce-expansion-beta-001.json') continue;
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

const existingPrompts = await collectExistingPrompts();
const duplicatePrompts = batch.subjects.flatMap((subject) => subject.questions)
  .map((question) => ({ question, source: existingPrompts.get(normalizeQuestionText(question.prompt)) }))
  .filter(({ source }) => source);
if (duplicatePrompts.length) {
  throw new Error(`Generated prompts duplicate existing content:\n${duplicatePrompts.map(({ question, source }) => `${question.id}: ${source}`).join('\n')}`);
}

const validation = validateQuestionBatch(batch, { mode: 'production' });
if (!validation.valid) throw new Error(`Generated batch failed validation:\n${validation.errors.join('\n')}`);

const sql = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const topicId = (subject, code) => `topic_was_${subject.key}_${code.split('-').at(-1).toLowerCase()}`;
const syllabusTopicId = (subject, code) => `st_was_${subject.key}_${code.split('-').at(-1).toLowerCase()}`;
const canonicalQuestionFields = [
  'topic_id', 'subject_id', 'exam_type_id', 'paper_type_id', 'past_paper_id',
  'question_text', 'question_type', 'round_type', 'options', 'correct_answer',
  'explanation', 'difficulty', 'points', 'marks', 'time_limit', 'question_number',
  'section', 'is_compulsory', 'image_url', 'syllabus_topic_id', 'command_word',
  'assessment_objective', 'source_paper_code', 'source_question_number', 'exam_board_id',
];

function questionValues(subject, question) {
  const options = JSON.stringify(question.options.map(({ label, text }) => `${label}. ${text}`));
  return {
    topic_id: topicId(subject, question.topicCode),
    subject_id: subject.subjectId,
    exam_type_id: 'exam_wassce',
    paper_type_id: null,
    past_paper_id: null,
    question_text: question.prompt,
    question_type: 'multiple_choice',
    round_type: null,
    options,
    correct_answer: question.correctAnswer,
    explanation: question.workedSolution,
    difficulty: question.difficulty,
    points: question.marks,
    marks: question.marks,
    time_limit: 90,
    question_number: null,
    section: null,
    is_compulsory: 1,
    image_url: null,
    syllabus_topic_id: syllabusTopicId(subject, question.topicCode),
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

function releaseMatch(alias, subject) {
  return [
    `${alias}.batch_id IS 'wassce-expansion-beta-001'`,
    `${alias}.quality_assurance IS 'automated_beta'`,
    `${alias}.release_channel IS 'beta'`,
    `${alias}.content_label IS ${sql(subject.contentLabel)}`,
    `${alias}.source_url IS ${sql(subject.releaseSourceUrl)}`,
    `${alias}.official_exam_board_content IS 0`,
    `${alias}.feedback_enabled IS 1`,
  ].join(' AND ');
}

const outBatch = resolve(outputRoot, 'content/batches/wassce-expansion-beta-001.json');
await mkdir(dirname(outBatch), { recursive: true });
await writeFile(outBatch, `${JSON.stringify(batch, null, 2)}\n`);

const migrationPaths = [];
const foundationPath = resolve(outputRoot, 'database/migrations/119_wassce_expansion_beta_foundation.sql');
const foundation = [
  '-- 119: BrillaPrep WASSCE beta blueprint specifications for IRS and transitional Applied Electricity.',
  '-- These are internal evidence blueprints, not official WAEC specification records.',
  'PRAGMA foreign_keys = ON;',
  "INSERT OR IGNORE INTO exam_boards (id, name, code, full_name, region, website_url, is_active, display_order) VALUES ('board_waec', 'WAEC', 'WAEC', 'West African Examinations Council', 'West Africa', 'https://waecgh.org/', 1, 1);",
];
for (const subject of subjects) {
  foundation.push(`INSERT OR IGNORE INTO subject_specifications (id, exam_board_id, subject_id, exam_type_id, syllabus_code, syllabus_name, specification_year, valid_from, syllabus_pdf_url, total_papers, assessment_info, is_active, display_order) VALUES (${sql(subject.specId)}, 'board_waec', ${sql(subject.subjectId)}, 'exam_wassce', ${sql(subject.specificationCode)}, ${sql(subject.syllabusName)}, NULL, NULL, ${sql(subject.releaseSourceUrl)}, 0, ${sql(subject.assessmentInfo)}, 1, 1);`);
}
foundation.push('CREATE TABLE IF NOT EXISTS _migration_119_guard (valid INTEGER NOT NULL CHECK (valid = 1));');
foundation.push('DELETE FROM _migration_119_guard;');
for (const subject of subjects) {
  foundation.push(`INSERT INTO _migration_119_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM subject_specifications WHERE id = ${sql(subject.specId)} AND exam_board_id IS 'board_waec' AND subject_id IS ${sql(subject.subjectId)} AND exam_type_id IS 'exam_wassce' AND syllabus_code IS ${sql(subject.specificationCode)} AND syllabus_name IS ${sql(subject.syllabusName)} AND specification_year IS NULL AND valid_from IS NULL AND syllabus_pdf_url IS ${sql(subject.releaseSourceUrl)} AND total_papers IS 0 AND assessment_info IS ${sql(subject.assessmentInfo)} AND is_active IS 1) THEN 1 ELSE 0 END;`);
}
foundation.push('DROP TABLE _migration_119_guard;');
await mkdir(dirname(foundationPath), { recursive: true });
await writeFile(foundationPath, `${foundation.join('\n')}\n`);
migrationPaths.push(foundationPath);

let migrationNumber = 120;
for (const subject of subjects) {
  const lines = [
    `-- ${migrationNumber}: BrillaPrep WASSCE ${subject.syllabusName} beta topic blueprint.`,
    '-- Internal evidence blueprint; not an official WAEC specification.',
    'PRAGMA foreign_keys = ON;',
  ];
  for (const [index, [code, title, objective]] of subject.topics.entries()) {
    lines.push(`INSERT OR IGNORE INTO topics (id, subject_id, name, slug, description, display_order) VALUES (${sql(topicId(subject, code))}, ${sql(subject.subjectId)}, ${sql(title)}, ${sql(`${subject.key}-${code.split('-').at(-1)}`)}, ${sql(objective)}, ${index + 1});`);
    lines.push(`INSERT OR IGNORE INTO syllabus_topics (id, specification_id, topic_code, title, description, assessment_objectives, display_order) VALUES (${sql(syllabusTopicId(subject, code))}, ${sql(subject.specId)}, ${sql(code)}, ${sql(title)}, ${sql(objective)}, ${sql(JSON.stringify(assessmentObjectives))}, ${index + 1});`);
  }
  lines.push(`CREATE TABLE IF NOT EXISTS _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));`);
  lines.push(`DELETE FROM _migration_${migrationNumber}_guard;`);
  for (const [index, [code, title, objective]] of subject.topics.entries()) {
    lines.push(`INSERT INTO _migration_${migrationNumber}_guard(valid) SELECT CASE WHEN EXISTS (SELECT 1 FROM topics WHERE id = ${sql(topicId(subject, code))} AND subject_id IS ${sql(subject.subjectId)} AND name IS ${sql(title)} AND slug IS ${sql(`${subject.key}-${code.split('-').at(-1)}`)} AND description IS ${sql(objective)} AND display_order IS ${index + 1}) AND EXISTS (SELECT 1 FROM syllabus_topics WHERE id = ${sql(syllabusTopicId(subject, code))} AND specification_id IS ${sql(subject.specId)} AND topic_code IS ${sql(code)} AND title IS ${sql(title)} AND description IS ${sql(objective)} AND assessment_objectives IS ${sql(JSON.stringify(assessmentObjectives))} AND display_order IS ${index + 1}) THEN 1 ELSE 0 END;`);
  }
  lines.push(`DROP TABLE _migration_${migrationNumber}_guard;`);
  const output = resolve(outputRoot, `database/migrations/${migrationNumber}_${subject.key}_beta_foundation.sql`);
  await writeFile(output, `${lines.join('\n')}\n`);
  migrationPaths.push(output);
  migrationNumber += 1;
}

for (const subject of subjects) {
  const questions = batch.subjects.find((entry) => entry.subjectId === subject.subjectId).questions;
  for (let part = 1; part <= 8; part += 1) {
    const partQuestions = questions.slice((part - 1) * 5, part * 5);
    const ids = partQuestions.map((question) => question.id);
    const guardTable = `_migration_${migrationNumber}_guard`;
    const lines = [
      `-- ${migrationNumber}: Original BrillaPrep WASSCE ${subject.syllabusName} beta questions, part ${part}.`,
      '-- Curriculum-aligned practice content; not official WAEC examination material.',
      'PRAGMA foreign_keys = ON;',
      `CREATE TABLE IF NOT EXISTS ${guardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
      `DELETE FROM ${guardTable};`,
    ];
    for (const question of partQuestions) {
      const values = questionValues(subject, question);
      lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = ${sql(question.id)} AND NOT (${canonicalMatch('q', values)})) AND NOT EXISTS (SELECT 1 FROM question_content_releases r WHERE r.question_id = ${sql(question.id)} AND NOT (${releaseMatch('r', subject)})) THEN 1 ELSE 0 END;`);
    }
    for (const question of partQuestions) {
      const values = questionValues(subject, question);
      lines.push(`INSERT OR IGNORE INTO questions (id, ${canonicalQuestionFields.join(', ')}) VALUES (${sql(question.id)}, ${canonicalQuestionFields.map((field) => sql(values[field])).join(', ')});`);
    }
    lines.push(`INSERT OR IGNORE INTO question_content_releases (question_id, batch_id, quality_assurance, release_channel, content_label, source_url, official_exam_board_content, feedback_enabled) SELECT id, 'wassce-expansion-beta-001', 'automated_beta', 'beta', ${sql(subject.contentLabel)}, ${sql(subject.releaseSourceUrl)}, 0, 1 FROM questions WHERE id IN (${ids.map(sql).join(', ')});`);
    lines.push(`DELETE FROM ${guardTable};`);
    lines.push(`INSERT INTO ${guardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions WHERE id IN (${ids.map(sql).join(', ')})) = 5 AND (SELECT COUNT(*) FROM question_content_releases r WHERE r.question_id IN (${ids.map(sql).join(', ')}) AND ${releaseMatch('r', subject)}) = 5 THEN 1 ELSE 0 END;`);
    lines.push(`DROP TABLE ${guardTable};`);
    const output = resolve(outputRoot, `database/migrations/${migrationNumber}_${subject.key}_beta_part_${part}.sql`);
    await writeFile(output, `${lines.join('\n')}\n`);
    migrationPaths.push(output);
    migrationNumber += 1;
  }
}

const allIds = batch.subjects.flatMap((entry) => entry.questions.map((question) => question.id));
const finalGuardTable = `_migration_${migrationNumber}_guard`;
const finalLines = [
  `-- ${migrationNumber}: Final exact-set and relationship guard for WASSCE expansion beta batch 001.`,
  'PRAGMA foreign_keys = ON;',
  `CREATE TABLE IF NOT EXISTS ${finalGuardTable} (valid INTEGER NOT NULL CHECK (valid = 1));`,
  `DELETE FROM ${finalGuardTable};`,
  `INSERT INTO ${finalGuardTable}(valid) SELECT CASE WHEN (SELECT COUNT(*) FROM questions q JOIN topics t ON t.id = q.topic_id JOIN syllabus_topics st ON st.id = q.syllabus_topic_id JOIN subject_specifications ss ON ss.id = st.specification_id JOIN question_content_releases r ON r.question_id = q.id WHERE q.id IN (${allIds.map(sql).join(', ')}) AND q.subject_id = t.subject_id AND q.subject_id = ss.subject_id AND q.exam_type_id = ss.exam_type_id AND q.exam_board_id = ss.exam_board_id AND q.question_type = 'multiple_choice' AND json_valid(q.options) AND json_array_length(q.options) = 4 AND q.correct_answer IN ('A','B','C','D') AND length(q.explanation) >= 80 AND r.batch_id = 'wassce-expansion-beta-001' AND r.quality_assurance = 'automated_beta' AND r.release_channel = 'beta' AND r.official_exam_board_content = 0 AND r.feedback_enabled = 1) = 80 AND (SELECT COUNT(*) FROM question_content_releases WHERE batch_id = 'wassce-expansion-beta-001') = 80 THEN 1 ELSE 0 END;`,
  `DROP TABLE ${finalGuardTable};`,
];
const finalOutput = resolve(outputRoot, `database/migrations/${migrationNumber}_wassce_expansion_beta_final_guard.sql`);
await writeFile(finalOutput, `${finalLines.join('\n')}\n`);
migrationPaths.push(finalOutput);

console.log(JSON.stringify({ validation, outBatch, migrations: migrationPaths }, null, 2));
