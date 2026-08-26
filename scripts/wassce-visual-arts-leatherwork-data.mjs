const item = (topicCode, prompt, correct, wrong, explanation, wrongRationales) => ({
  topicCode,
  prompt,
  correct,
  wrong,
  explanation,
  wrongRationales,
});

const catalogueUrl = 'https://waecgh.org/home/wassce-school/';
const timetableUrl = 'https://waecgh.org/wp-content/uploads/2026/03/FINAL-TIMETABLE-FOR-WASSCE-SC-2026-GHANA-ONLY-NEW-TAD.pdf';
const examinerReportUrl = 'https://waecgh.org/wp-content/uploads/2025/05/CHIEF-EXAMINERS-REPORTS.-WASSCE-SC-2023.pdf';
const naccaCurriculumIndexUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';
const naccaArtFoundationUrl = 'https://nacca.gov.gh/wp-content/uploads/2025/04/Art-and-Design-Foundation-Curriculum.pdf';
const naccaArtStudioUrl = 'https://nacca.gov.gh/wp-content/uploads/2025/04/Art-and-Design-Studio-Curriculum.pdf';

export const leatherwork = {
  key: 'leatherwork',
  subjectId: 'subj_wassce_leatherwork',
  specId: 'spec_wassce_leatherwork_brilla_b004',
  specificationCode: 'BRILLA-WASSCE-LEATHERWORK-BETA-004',
  syllabusName: 'BrillaPrep transitional Leatherwork beta content blueprint',
  assessmentInfo: 'Internal BrillaPrep evidence blueprint for the transitional Leatherwork pathway represented in WAEC Ghana and NaCCA sources. It does not claim an official syllabus code, validity date or paper structure.',
  releaseSourceUrl: examinerReportUrl,
  contentLabel: 'Original BrillaPrep transitional Leatherwork practice aligned to WAEC Ghana examiner evidence and Ghana curriculum sources; not official WAEC examination material or a copied past paper.',
  sources: [
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates subject catalogue', url: catalogueUrl },
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates 2026 final timetable', url: timetableUrl },
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE 2023 Chief Examiners Report: Leatherwork 2 and 3', url: examinerReportUrl },
    { publisher: 'National Council for Curriculum and Assessment, Ghana', title: 'Secondary Education Curriculum index', url: naccaCurriculumIndexUrl },
    { publisher: 'National Council for Curriculum and Assessment, Ghana', title: 'Art and Design Foundation Curriculum', url: naccaArtFoundationUrl },
    { publisher: 'National Council for Curriculum and Assessment, Ghana', title: 'Art and Design Studio Curriculum', url: naccaArtStudioUrl },
  ],
  topics: [
    ['LW-1', 'Leather sources, structure and properties', 'Relate animal source, layer structure, tannage and physical properties to suitable leather-product uses.'],
    ['LW-2', 'Preservation, tanning and preparation', 'Explain preservation, beamhouse, pickling, tanning and surface-preparation processes used to produce serviceable leather.'],
    ['LW-3', 'Tools, maintenance and workshop safety', 'Select, maintain and use leatherworking tools safely for measuring, marking, punching and edge work.'],
    ['LW-4', 'Design, measurement and pattern development', 'Develop functional leather-product designs, accurate patterns, allowances and prototypes from stated requirements.'],
    ['LW-5', 'Cutting, skiving and edge preparation', 'Cut leather economically, control thickness and prepare edges and bonding surfaces for accurate assembly.'],
    ['LW-6', 'Joining, stitching and hardware', 'Select and execute suitable stitches, gusset fixing, adhesive bonds and hardware connections for service loads.'],
    ['LW-7', 'Decoration, colouring and finishing', 'Apply casing, tooling, colouring, edge treatment and protective finishes in a controlled sequence.'],
    ['LW-8', 'Costing, marketing, quality and care', 'Estimate fixed and variable costs, market products, inspect workmanship and care for leather articles in Ghanaian conditions.'],
  ],
  facts: [
    item(
      'LW-1',
      'Which description best identifies kip in leather classification?',
      'A bovine hide from an animal older than a calf but lighter than a mature cow hide',
      [
        'A goat skin selected mainly for its tight grain and small area',
        'The lower flesh split removed from any heavy hide during splitting',
        'A mature cow hide classified by its finished colour rather than age and weight',
      ],
      'Kip occupies an intermediate bovine class between calfskin and mature cow hide, so its area, thickness and fibre character differ from both lighter calfskin and heavier cow hide.',
      [
        'Goat skin is a separate species classification; its compact grain does not make it kip.',
        'A flesh split describes a layer produced by splitting, not the age and size class called kip.',
        'Mature cow hide is heavier stock, and colour grading does not redefine it as kip.',
      ],
    ),
    item(
      'LW-1',
      'How does split leather differ from grained leather made from the same hide?',
      'Split leather comes from a lower layer and lacks the original natural grain surface',
      [
        'Split leather retains much of the natural grain but is cut into smaller panels',
        'Grained leather is commonly the flesh split after a surface pattern has been printed on it',
        'Split and grained leather describe identical layers but different dye colours',
      ],
      'Mechanical splitting separates hide layers: the grain layer retains the natural outer surface, while a lower split can be finished or embossed but does not possess that original grain.',
      [
        'Panel size is unrelated to layer identity; cutting a grain layer smaller does not make it a split.',
        'A flesh split may be embossed to imitate grain, but genuine grained leather retains the outer layer.',
        'The terms identify structural layers and surfaces, not alternative names for colour treatments.',
      ],
    ),
    item(
      'LW-1',
      'What is the purpose of buffing leather during surface preparation?',
      'Use controlled abrasion to level defects or raise a uniform nap for the intended finish',
      [
        'Compress the grain with a glazing tool until it becomes a firm polished surface',
        'Remove thickness evenly through the whole hide in the same way as splitting',
        'Apply pigment mechanically while leaving the surface texture unchanged',
      ],
      'Buffing uses an abrasive action on the grain or flesh side to reduce surface irregularities or develop a controlled nap, depending on whether corrected grain, nubuck or suede is required.',
      [
        'Glazing compresses and polishes a surface, whereas buffing cuts it lightly with abrasive material.',
        'Splitting separates layers and controls bulk thickness; buffing treats only a surface zone.',
        'Pigment coating adds colour and coverage after preparation; it is not the abrasive buffing step.',
      ],
    ),
    item(
      'LW-1',
      'What fundamental change does tanning produce in a prepared pelt?',
      'It stabilises collagen against putrefaction and excessive water sensitivity',
      [
        'It preserves the raw pelt temporarily by drawing out moisture with salt',
        'It removes hair by alkaline swelling without stabilising the collagen',
        'It lubricates already tanned fibres so the dried leather remains flexible',
      ],
      'Tanning agents create stabilising interactions in the collagen structure, converting a perishable pelt into leather with improved biological, wet and thermal stability.',
      [
        'Salting delays bacterial damage before processing but does not create permanently tanned collagen.',
        'Liming helps unhair and open fibres, yet an untanned limed pelt remains perishable.',
        'Fatliquoring improves flexibility after tannage; it does not perform the collagen stabilisation itself.',
      ],
    ),
    item(
      'LW-1',
      'Why should leather thickness and stretch be checked in several zones before laying out a bag pattern?',
      'Natural variation determines which zones suit straps, gussets and broad panels',
      [
        'A single centre reading is sufficient to represent the mechanical behaviour of the hide',
        'Stretch direction matters for garment leather but not for loaded straps or handles',
        'Matching surface colour indicates equal substance and firmness across the zones',
      ],
      'A hide varies from firm backbone areas to stretchier belly and flank zones, so measuring and flexing several areas helps assign each component to material that suits its load and form.',
      [
        'The centre may be firmer than edge zones, so one reading cannot represent the complete hide.',
        'Loaded components are especially sensitive to stretch direction because elongation changes fit and durability.',
        'Colour can appear uniform over zones that still differ materially in thickness, stretch and fibre density.',
      ],
    ),

    item(
      'LW-2',
      'Which description correctly identifies combination tanning?',
      'The leather receives two compatible tannages in sequence so their properties complement one another',
      [
        'Fresh hides are wet salted and later brined, with the two preservation steps counted as separate tannages',
        'A pickled pelt receives one chrome-tanning bath followed by neutralisation and drying',
        'Finished leather is bleached and then dyed, combining two colour treatments into a tannage',
      ],
      'Combination tanning deliberately applies two compatible tanning systems, such as vegetable tannage followed by chrome or another mineral tannage, to combine useful handle, colour, strength or ageing properties.',
      [
        'Wet salting and brining are raw-hide preservation methods; using both does not create two collagen-stabilising tannages.',
        'Pickling prepares a pelt for chrome penetration, while neutralisation and drying do not add a second tanning system.',
        'Bleaching and dyeing alter colour, but neither treatment supplies the second collagen-stabilising tannage required here.',
      ],
    ),
    item(
      'LW-2',
      'What is the main purpose of fleshing before tanning?',
      'Remove adhering fat, connective tissue and flesh from the inner surface',
      [
        'Abrade the grain lightly so pigment can cover natural marks',
        'Reduce the pH with acid and salt before mineral tanning',
        'Introduce lubricating oils between fibres before drying',
      ],
      'Fleshing clears residual tissue that would decay or obstruct even chemical penetration, leaving a cleaner pelt for subsequent beamhouse and tanning operations.',
      [
        'Light grain abrasion is buffing, a later surface operation with a different purpose.',
        'Acid-and-salt pH adjustment is pickling and follows the early beamhouse cleaning stages.',
        'Fibre lubrication is fatliquoring after tannage, not removal of tissue from a raw pelt.',
      ],
    ),
    item(
      'LW-2',
      'What useful effect does controlled liming have during beamhouse processing?',
      'It loosens hair and opens the fibre structure for further cleaning',
      [
        'It lowers pH to prepare the pelt directly for chrome tanning',
        'It deposits the final resin topcoat over the grain surface',
        'It neutralises finished leather after dyeing and fatliquoring',
      ],
      'Alkaline liming swells and opens collagen while helping remove hair and unwanted proteins; concentration and time must be controlled to avoid weakening the pelt.',
      [
        'Lowering pH with acid and salt is the function of pickling, not alkaline liming.',
        'A resin topcoat belongs to finishing after tanning, colouring and surface preparation.',
        'Neutralisation reduces residual acidity after mineral tanning; liming occurs much earlier.',
      ],
    ),
    item(
      'LW-2',
      'Which sequence best represents vegetable tanning after a cured hide enters production?',
      'Soak and clean it, lime and unhair it, flesh and delime it, then expose the prepared pelt progressively to vegetable-tannin liquors before conditioning and drying',
      [
        'Soak and flesh the hide, begin with the strongest tannin liquor, then lime and unhair it after tannage',
        'Pickle the pelt, carry out one chrome-tanning bath, and add vegetable dye during surface finishing',
        'Wet-salt the hide, dry it fully, apply vegetable dye to the grain, then condition it without tannin penetration',
      ],
      'Vegetable tanning follows beamhouse cleaning and pelt preparation, then introduces plant tannins through controlled liquors, commonly progressing from milder to stronger concentration so penetration develops before drying and finishing.',
      [
        'Starting with strong tannin can fix the surface too quickly, and liming after tannage would disrupt the required process order.',
        'Pickling and chromium salts describe chrome tanning; adding vegetable-coloured dye later does not turn it into vegetable tannage.',
        'Wet salting preserves raw hide and surface dye adds colour, but vegetable tanning requires tannins to penetrate the prepared pelt.',
      ],
    ),
    item(
      'LW-2',
      'Which statement best describes tawing in leather production?',
      'A prepared skin is treated mainly with alum salts, commonly with salt and lubricating materials, to produce pale supple leather',
      [
        'A prepared pelt is moved through vegetable-tannin liquors until tannins stabilise and colour the collagen',
        'A pickled pelt is treated with basic chromium salts and then basified to fix the chrome',
        'A finished leather surface is bleached to a pale colour and coated without treating the collagen',
      ],
      'Tawing is traditionally based on aluminium salts with salt and lubricating or binding ingredients. It yields light-coloured flexible material whose treatment is generally more water-sensitive than vegetable or chrome tannage.',
      [
        'Progressive plant-tannin penetration identifies vegetable tanning rather than the alum-based treatment called tawing.',
        'Chromium-salt penetration and basification identify chrome tanning, a different mineral process from alum tawing.',
        'Bleaching changes unwanted colour and a coating covers the surface; neither description accounts for alum treatment of the pelt.',
      ],
    ),

    item(
      'LW-3',
      'How should a head knife be moved when making a controlled cut at the leather bench?',
      'Away from the body and supporting hand along a clear cutting path',
      [
        'Toward the supporting hand while the fingers hold the pattern edge',
        'Across leather balanced on the lap so the material can rotate freely',
        'Sideways through the cut while the blade is twisted to correct direction',
      ],
      'Securing the leather on a cutting board and directing the knife away from the body keeps hands outside the blade path and lets the sharpened edge follow the pattern predictably.',
      [
        'Pulling toward the supporting hand places fingers directly in the likely overrun path.',
        'Lap cutting provides poor support and exposes the body if the blade exits the leather.',
        'Twisting a sharp blade in the cut reduces control and can break the edge or damage the pattern line.',
      ],
    ),
    item(
      'LW-3',
      'What is the primary use of a pricking iron in hand-stitched leatherwork?',
      'Mark or form evenly spaced stitch positions at a consistent angle',
      [
        'Open one round hole at a time for fitting press-stud hardware',
        'Thin a fold line by shaving a taper from the flesh side',
        'Crease a decorative line parallel to a finished edge',
      ],
      'A pricking iron establishes repeated spacing and orientation for a seam, guiding later awl work or stitching so the thread pattern remains regular.',
      [
        'A drive or rotary punch is normally selected for isolated round hardware holes.',
        'A skiving knife or machine reduces thickness; a pricking iron does not shave leather.',
        'A creaser makes a continuous decorative or guide line rather than separated stitch marks.',
      ],
    ),
    item(
      'LW-3',
      'What does an edge beveller remove from a cut leather edge?',
      'A narrow sharp corner so the edge can be rounded and finished',
      [
        'A broad taper from the flesh side where two layers will overlap',
        'A shallow groove that locates a line of recessed stitches',
        'A measured strip that becomes the seam allowance for assembly',
      ],
      'The edge beveller pares a small consistent arris from the grain or flesh corner, allowing sanding and burnishing to form a comfortable rounded profile.',
      [
        'A broad overlap taper is a skive and requires a skiving knife or machine.',
        'A stitching groover removes a narrow channel along the seam line, not the edge corner.',
        'Seam allowance is established in the pattern and cutting stage, not removed by bevelling.',
      ],
    ),
    item(
      'LW-3',
      'Why should a scratch awl be used with light pressure when tracing a pattern?',
      'A shallow visible line guides cutting without weakening or deeply scarring the leather',
      [
        'A deep channel is needed so the cutting knife cannot move away from the pattern',
        'A row of full-depth holes gives the same result as an accurate cutting line',
        'Heavy scoring is preferred because shallow marks can be difficult to follow under workshop lighting',
      ],
      'A controlled awl line must remain readable but shallow, because deep scoring can become a visible defect or create a stress line beside a finished edge.',
      [
        'The knife should be controlled against the template; a deep channel damages useful fibres.',
        'Perforation weakens the component and is not equivalent to a continuous cutting guide.',
        'Good lighting and an appropriate awl produce a visible fine line without destructive pressure.',
      ],
    ),
    item(
      'LW-3',
      'What maintenance best preserves a sharp leather-cutting tool between uses?',
      'Clean and dry the blade, protect the edge and store it in a fixed safe place',
      [
        'Leave dried contact adhesive on the bevel as a temporary protective coating',
        'Rest the cutting edge directly on the bench so the tool cannot roll',
        'Store the blade with damp sharpening residue to reduce later honing time',
      ],
      'Removing residue and moisture protects the steel, while an edge guard and designated storage position prevent accidental contact and damage to the sharpened bevel.',
      [
        'Cured adhesive contaminates the edge and can pull or chip it when removed before use.',
        'Direct bench contact dulls the fine cutting edge even when the tool remains stationary.',
        'Moist abrasive residue encourages corrosion and does not preserve a finished cutting edge.',
      ],
    ),

    item(
      'LW-4',
      'Why is a seam allowance added outside the finished outline of a leather pattern?',
      'Provide material for the selected stitched, folded or bonded joint',
      [
        'Compensate for colour variation by making the visible panel larger',
        'Mark the portion that should be skived away across its full width',
        'Replace the need to specify the finished dimensions of the article',
      ],
      'The allowance supplies joint width beyond the finished line, preserving the required product dimensions after edges are folded, bonded or stitched together.',
      [
        'Colour placement is handled during hide layout and does not define structural seam width.',
        'Only selected overlap zones may be skived; the entire seam allowance normally remains part of the joint.',
        'Finished dimensions are still required because the allowance is calculated from them and the joining method.',
      ],
    ),
    item(
      'LW-4',
      'What should guide the orientation of a long strap pattern on a hide?',
      'The intended load together with the direction of stretch and the location of defects',
      [
        'The shortest route across the belly because that zone normally stretches most easily',
        'The direction that produces the brightest colour even if the fibres elongate under load',
        'The outer outline of the hide without reference to backbone or flank zones',
      ],
      'A strap carries repeated lengthwise load, so the maker aligns it through firm sound material while accounting for stretch direction, scars and economical yield.',
      [
        'Belly leather is often looser and stretchier, making it a poor default for a loaded strap.',
        'Colour matters visually, but load-bearing performance requires suitable fibre firmness and orientation.',
        'Hide shape alone does not reveal whether a proposed strip crosses weak flank or damaged areas.',
      ],
    ),
    item(
      'LW-4',
      'What pattern function does a gusset perform in a leather bag?',
      'It joins major panels at a planned distance to create side or base depth',
      [
        'It mainly reinforces the handle attachment without changing internal volume',
        'It replaces the front panel with a folded decorative strip',
        'It serves as a removable cutting guide after the bag has been stitched',
      ],
      'A gusset is drafted as a side or base component whose length, width and seam allowances control the bag volume and the fit between the main panels.',
      [
        'Handle reinforcement may be separate; it does not provide continuous side and base depth.',
        'A gusset complements the front and back panels rather than substituting for a principal face.',
        'The paper template guides cutting, while the leather gusset remains a structural part of the bag.',
      ],
    ),
    item(
      'LW-4',
      'What is the value of making a card prototype before cutting expensive leather?',
      'It reveals proportion, fold, fit and assembly problems at low cost',
      [
        'It proves that leather thickness and stiffness will have no effect on construction',
        'It fixes the final dimensions even when the closure and hardware later change',
        'It provides a finished surface sample for judging dye absorption on the leather',
      ],
      'A mock-up tests geometry and construction sequence before valuable material is cut, allowing pattern corrections while acknowledging that leather thickness still needs separate allowance.',
      [
        'Card tests geometry but cannot erase the need to account for leather thickness and flexibility.',
        'Hardware or closure changes can alter allowances, so the prototype should be revised with the design.',
        'Card does not reproduce leather chemistry and therefore cannot predict dye absorption or finish colour.',
      ],
    ),
    item(
      'LW-4',
      'How can a mirrored pattern piece be developed accurately from a centre line?',
      'Fold the pattern on the centre line and cut or trace both halves from the same outline',
      [
        'Measure each half independently from its nearest outside edge',
        'Rotate one completed half around a corner point instead of the centre line',
        'Add a wider seam allowance to one side to correct small drawing differences',
      ],
      'Using the fold as a common datum duplicates one verified half on both sides, avoiding cumulative measurement differences that produce an asymmetric component.',
      [
        'Independent edge references allow small measurement errors to differ between the two halves.',
        'Rotation about a corner changes the relationship to the intended centre axis.',
        'Unequal seam allowances conceal rather than correct an inaccurate finished outline.',
      ],
    ),

    item(
      'LW-5',
      'Why should the blade be held nearly vertical when cutting a square leather edge?',
      'It keeps the cut face perpendicular instead of undercutting the template',
      [
        'It produces a long feather skive along the component edge',
        'It makes the flesh-side outline smaller so paired panels nest automatically',
        'It compresses the edge fibres enough to replace later burnishing',
      ],
      'A vertical blade follows the template at both grain and flesh surfaces, giving accurate mating dimensions and a square edge suitable for alignment and finishing.',
      [
        'A feather skive requires a deliberately shallow blade angle and serves a different joint purpose.',
        'A smaller flesh outline is an undercut defect that prevents paired panels from matching cleanly.',
        'Cutting establishes shape; burnishing is a later controlled smoothing and compaction process.',
      ],
    ),
    item(
      'LW-5',
      'What is the purpose of skiving the end of a leather strap before folding it?',
      'Reduce bulk with a gradual taper while retaining useful fibre length',
      [
        'Create a square step so all folded thickness ends at one abrupt line',
        'Remove the grain across the fold because flesh fibres provide the main load path',
        'Cut the strap to half width so it can turn around the hardware',
      ],
      'A controlled taper lets overlapping layers fold without an obvious lump, while sufficient length and thickness avoid creating a weak hinge at the skive boundary.',
      [
        'An abrupt step concentrates bending and remains visible through the folded assembly.',
        'The grain contributes strength and should not be stripped indiscriminately from the fold.',
        'Width reduction changes load capacity and fit; skiving is primarily controlled thickness reduction.',
      ],
    ),
    item(
      'LW-5',
      'Why are paired leather components cut from the same verified template?',
      'Their mating outlines, notches and hole positions remain consistent',
      [
        'Both pieces then acquire the same grain direction regardless of hide placement',
        'The template automatically avoids scars without inspection of the hide surface',
        'Repeated tracing compensates for a template whose finished dimensions are inaccurate',
      ],
      'One accurate template controls repeated geometry and assembly references, although the maker must still orient each part and inspect the leather zone before cutting.',
      [
        'Grain and stretch direction depend on where each template is placed, not on template identity alone.',
        'Natural defects remain a layout decision and cannot be detected by an opaque template automatically.',
        'Repeating an inaccurate template reproduces the same error rather than correcting finished dimensions.',
      ],
    ),
    item(
      'LW-5',
      'What should be placed beneath leather when using a drive punch?',
      'A resilient cutting board that supports a clean exit and protects the cutting edge',
      [
        'A hardened steel plate that prevents the punch from entering the support',
        'A thick offcut of finished leather intended for the same product',
        'A soft folded cloth that lets the work move under the impact',
      ],
      'A dense resilient punching surface supports the material while allowing the edge to pass through cleanly without striking steel, damaging another component or becoming unstable.',
      [
        'Steel contact quickly rolls or chips the punch edge and can produce an incomplete hole.',
        'A product offcut can be marked or perforated and gives less reliable support than a cutting board.',
        'Folded cloth absorbs impact unevenly and permits movement that distorts the hole position.',
      ],
    ),
    item(
      'LW-5',
      'Why are smooth finished surfaces lightly abraded only inside an adhesive joint area?',
      'Expose a clean keyed surface for bonding while preserving the visible finish elsewhere',
      [
        'Polish the joint until adhesive remains on the surface instead of wetting it',
        'Thin both parts through most of their substance before the adhesive is applied',
        'Extend the abrasion beyond the seam so the finish colour becomes uniform',
      ],
      'Controlled roughening removes weak finish and increases effective contact within the hidden bond area; excessive depth or spread damages strength and appearance.',
      [
        'Polishing reduces mechanical key and can leave the adhesive attached mainly to a weak coating.',
        'Major thickness reduction is skiving and may weaken a joint if used without design need.',
        'Visible abrasion creates a finish defect and does not improve the bond outside the joint footprint.',
      ],
    ),

    item(
      'LW-6',
      'How is a traditional two-needle saddle stitch formed through each prepared hole?',
      'Both ends of one thread pass through each hole from opposite sides',
      [
        'One needle carries a loop while a separate bobbin thread locks it beneath the leather',
        'Each needle uses an independent short thread tied inside the same hole',
        'A single needle passes through alternate holes and returns along the edge',
      ],
      'In saddle stitching, a needle is attached to each end of one continuous thread and the two ends cross through every hole from opposite faces, producing a balanced hand seam.',
      [
        'A needle-and-bobbin lockstitch describes machine sewing rather than the two-ended hand method.',
        'Independent threads at every hole would create many weak knots and no continuous saddle seam.',
        'Skipping alternate holes leaves an incomplete seam and does not form the opposing thread path.',
      ],
    ),
    item(
      'LW-6',
      'What is a likely effect of placing stitch holes too close to a leather edge?',
      'The narrow remaining margin may tear out under seam load',
      [
        'The stitch line gains more bearing area because it is nearer the cut face',
        'The seam becomes stronger because the thread can tighten around less leather',
        'The edge distance no longer matters once contact adhesive is added',
      ],
      'Thread transfers load through the leather outside each perforation, so the seam needs enough sound edge margin to resist the concentrated force without splitting.',
      [
        'Moving holes outward reduces rather than increases the material available to carry thread load.',
        'Less material around a tightened stitch raises stress and makes tear-out more likely.',
        'Adhesive can share load but does not restore fibre area removed by poorly positioned holes.',
      ],
    ),
    item(
      'LW-6',
      'When should two surfaces coated with contact adhesive normally be joined?',
      'After the carrier has flashed off and the manufacturer-specified tack time is reached',
      [
        'Immediately while both coatings are freely wet so the parts can slide into alignment',
        'After both films have cured hard and surface tack has disappeared',
        'At a standard fifteen-minute wait for water-based and solvent-based products',
      ],
      'Contact adhesives develop their intended grab after the water or solvent carrier has flashed off to the specified tack stage; the product instructions govern open time and reactivation.',
      [
        'Joining freely wet films can trap carrier, encourage movement and produce a weak or uneven bond.',
        'Fully hard non-tacky films may be outside their bonding window unless the manufacturer permits reactivation.',
        'Formulations and workshop conditions differ, so a universal waiting time is technically unsound.',
      ],
    ),
    item(
      'LW-6',
      'What method helps fix a bag gusset accurately before permanent stitching?',
      'Match centre and notch marks, then hold the aligned seam progressively with clips or temporary compatible adhesive',
      [
        'Secure one end permanently and stretch the gusset until the other end reaches its mark',
        'Trim the gusset repeatedly during stitching whenever the notches stop matching',
        'Drive permanent rivets through unverified positions before aligning the curved seam',
      ],
      'Matched reference marks distribute gusset length around curves, while progressive temporary fixing prevents creep and lets the maker confirm alignment before committing the seam.',
      [
        'Stretching distorts the gusset and concentrates excess or shortage at the opposite end.',
        'Trimming during assembly destroys the verified allowance and can leave the gusset too short.',
        'Early permanent rivets lock errors in place and can damage material when repositioned.',
      ],
    ),
    item(
      'LW-6',
      'How is a suitable rivet post length selected for a leather joint?',
      'Allow for the complete material stack plus enough post to form the specified set',
      [
        'Choose a post flush with the first layer before the remaining layers are added',
        'Use the longest available post and tighten it until the leather stops compressing',
        'Measure the metal cap diameter because it determines the required post length',
      ],
      'The post must pass through leather, lining and reinforcement and still provide the maker-recommended forming allowance without excessive protrusion, bending or crushing.',
      [
        'A post sized to one layer cannot engage the cap properly through the complete joint.',
        'Excess length tends to bend or set loosely and over-compression can permanently damage leather.',
        'Cap diameter affects bearing area, but post length must be chosen from the assembled thickness.',
      ],
    ),

    item(
      'LW-7',
      'Why is vegetable-tanned leather lightly cased before carving or stamping?',
      'Controlled moisture makes the fibres accept and retain compressed detail',
      [
        'A dry surface lets the tool compress fibres more evenly without drag',
        'Full soaking keeps impressions sharp because the fibres cannot move',
        'Casing applies the final water-resistant coating before decoration',
      ],
      'Evenly dampened vegetable-tanned leather becomes receptive to modelling and then firms as it dries; material that is too dry or saturated gives poor control and definition.',
      [
        'Dry fibres resist compression and encourage tool bounce or shallow irregular impressions.',
        'Saturation makes the leather unstable and can blur detail or distort the component.',
        'Casing is temporary moisture conditioning, not the final protective finishing operation.',
      ],
    ),
    item(
      'LW-7',
      'Which statement correctly distinguishes dyeing from tanning in leather production?',
      'Dyeing introduces colour into prepared leather, whereas tanning chemically stabilises the hide fibres against decay',
      [
        'Dyeing stabilises raw collagen, whereas tanning adds a removable surface colour',
        'Dyeing and tanning are two names for applying pigment after the leather has dried',
        'Tanning removes grease before colouring, whereas dyeing replaces the beamhouse operations',
      ],
      'Tanning converts a perishable hide or skin into a more durable material by stabilising collagen. Dyeing is a later or integrated colouring operation and does not replace the chemical protection supplied by tannage.',
      [
        'This reverses the functions: tanning stabilises collagen, while dyeing supplies colour within or upon prepared leather.',
        'Pigment coating is one colouring method, but tanning is a distinct fibre-stabilising process rather than another name for pigment application.',
        'Degreasing is a preparation operation and beamhouse work prepares the pelt; neither definition states the purpose of dyeing or tanning.',
      ],
    ),
    item(
      'LW-7',
      'What identifies appliqué as a leather-decoration method?',
      'Cut decorative pieces are arranged on a leather ground and secured by stitching, adhesive, or both',
      [
        'A heated point darkens lines directly into the grain without adding another piece',
        'A modelling tool makes repeated small impressions to build dotted tone and texture',
        'A knife removes a recess so a contrasting piece finishes level with the surrounding surface',
      ],
      'Leather appliqué builds a design by placing separately cut motifs on top of a supporting ground and fixing their edges securely, allowing colour, texture and relief to contrast with the base.',
      [
        'Darkening the original grain with a heated point describes scorching or pyrographic decoration, not attachment of a cut motif.',
        'Repeated dot-like impressions describe stippling, which works the ground surface instead of adding a separate decorative piece.',
        'Recessing an insert until it sits level describes inlay; appliqué normally places and secures the motif on the ground surface.',
      ],
    ),
    item(
      'LW-7',
      'What does burnishing do to a properly prepared vegetable-tanned leather edge?',
      'It compacts and smooths exposed fibres using controlled moisture or compound and friction',
      [
        'It raises a loose nap so the edge resembles the flesh side of suede',
        'It removes a broad taper from the edge to reduce folded thickness',
        'It deposits enough adhesive to become the main structural joint',
      ],
      'After levelling and bevelling, controlled friction aligns and compacts edge fibres into a smoother surface that is comfortable and more resistant to light abrasion.',
      [
        'Raising a nap is associated with abrasive suede preparation, the opposite of edge compaction.',
        'Broad thickness tapering is skiving and precedes assembly rather than finishing the exposed edge.',
        'Burnishing compounds assist surface smoothing; they are not structural joining adhesives.',
      ],
    ),
    item(
      'LW-7',
      'Which statement correctly distinguishes scorching from stippling on leather?',
      'Scorching uses controlled heat to darken a design, while stippling forms tone or texture with repeated small dots or impressions',
      [
        'Scorching builds dotted texture with a pointed punch, while stippling browns the grain with a heated tool',
        'Scorching secures cut motifs to a ground, while stippling recesses a contrasting insert flush with the surface',
        'Scorching removes a thin surface layer with a knife, while stippling applies a continuous opaque dye film',
      ],
      'Scorching, or pyrographic work, controls a heated tool to brown the leather without burning through it; stippling accumulates separate dots or impressions to create texture, shading or emphasis.',
      [
        'This swaps the methods: a pointed tool can stipple repeated marks, while controlled heat produces the scorched tonal line or area.',
        'Attaching cut motifs is appliqué and fitting a flush contrasting insert is inlay; neither operation defines scorching or stippling.',
        'Knife removal describes carving or surface cutting, while an opaque dye film is colouring rather than a field of stippled impressions.',
      ],
    ),

    item(
      'LW-8',
      'Which workshop expense is normally treated as a fixed cost when costing a batch of leather belts?',
      'Monthly rent for the production space',
      [
        'Leather consumed by each belt pattern',
        'Buckles purchased for the number of belts made',
        'Packaging used for each completed belt',
      ],
      'Rent is incurred for the period even if output changes, while leather, buckles and unit packaging generally rise or fall with the number of belts produced.',
      [
        'Leather consumption varies with the number, size and yield of belts, making it a variable material cost.',
        'Buckles are direct components purchased in proportion to the units planned or sold.',
        'Unit packaging is consumed as products are completed and therefore varies with output.',
      ],
    ),
    item(
      'LW-8',
      'How should variable cost per leather wallet be estimated for a planned production run?',
      'Add leather, lining, thread, hardware and unit packaging consumed by one wallet',
      [
        'Divide monthly rent alone by the selling price of one wallet',
        'Allocate the purchase cost of the main workshop tools directly to the first production run',
        'Subtract direct materials from revenue and call the balance variable cost',
      ],
      'Variable unit cost follows the resources consumed by each wallet; fixed overhead and durable equipment are allocated separately when calculating total cost and price.',
      [
        'Rent is a fixed overhead and dividing it by selling price does not measure variable consumption.',
        'Durable tools serve many units and should be depreciated or allocated rather than charged fully to one wallet.',
        'Revenue minus materials is a margin measure and omits other variable inputs such as hardware and packaging.',
      ],
    ),
    item(
      'LW-8',
      'Which marketing action best tests demand for a new handmade leather-bag design in Ghana?',
      'Show a priced prototype to a defined customer segment and record orders, objections and preferred features',
      [
        'Produce a large stock before showing the design so buyers cannot influence it',
        'Ask workshop staff to judge the colour and shape before setting the production quantity',
        'Set the price from a competitor photograph without checking size, material or workmanship',
      ],
      'A priced prototype tested with intended buyers produces evidence about willingness to pay, use needs and objections before scarce leather and labour are committed to inventory.',
      [
        'Large speculative production increases stock risk before demand and feature preferences are known.',
        'Workshop opinions do not substitute for feedback from the customer group expected to purchase and use it.',
        'A photograph lacks the cost, quality and specification detail needed for defensible price comparison.',
      ],
    ),
    item(
      'LW-8',
      'Which response best addresses common leather-enterprise constraints in Ghana such as imported inputs, humid storage and inconsistent material supply?',
      'Qualify multiple suppliers, inspect incoming leather, control dry ventilated storage and price from current landed costs',
      [
        'Use one supplier without incoming inspection so colour remains associated with one source',
        'Hold damp leather in sealed stacks to protect it from dust during the humid season',
        'Keep prices fixed from an old purchase even when exchange and transport costs change',
      ],
      'Supplier diversification, incoming quality checks, moisture control and current cost records reduce disruption, mould loss and margin erosion when local availability and imported-input costs vary.',
      [
        'Single sourcing increases interruption risk, and lack of inspection allows variable defects into production.',
        'Sealed damp stacks trap the moisture that supports mould, staining and fibre deterioration.',
        'Outdated prices can erase the contribution margin when landed material and transport costs rise.',
      ],
    ),
    item(
      'LW-8',
      'What combined check best supports quality and care before a leather bag is delivered?',
      'Inspect seams, edges and hardware under load, then give care advice suited to the leather and finish',
      [
        'Judge quality from surface shine and advise frequent soaking to maintain flexibility',
        'Inspect the lining appearance and defer structural testing until a sample is used',
        'Apply a heavy conditioner before conducting a colourfastness test',
      ],
      'Delivery inspection should confirm structural and finish performance, while material-specific advice on cleaning, moisture, heat and conditioning helps the customer preserve the article safely.',
      [
        'Shine can hide weak construction, and soaking risks distortion, dye movement and loss of fibre lubrication.',
        'Lining appearance does not reveal seam strength, edge security, handle anchorage or faulty hardware.',
        'Conditioners can darken or disrupt finishes, so compatibility and colourfastness must be tested first.',
      ],
    ),
  ],
};
