import { item as baseItem } from './wassce-craft-beta-data.mjs';

const timetableUrl = 'https://waecgh.org/wp-content/uploads/2026/03/FINAL-TIMETABLE-FOR-WASSCE-SC-2026-GHANA-ONLY-NEW-TAD.pdf';
const examinerReportUrl = 'https://waecgh.org/wp-content/uploads/2025/05/CHIEF-EXAMINERS-REPORTS.-WASSCE-SC-2023.pdf';
const curriculumIndexUrl = 'https://nacca.gov.gh/secondary-education-curriculum/';
const studioCurriculumUrl = 'https://nacca.gov.gh/wp-content/uploads/2025/04/Art-and-Design-Studio-Curriculum.pdf';
const foundationCurriculumUrl = 'https://nacca.gov.gh/wp-content/uploads/2025/04/Art-and-Design-Foundation-Curriculum.pdf';

const item = (topicCode, prompt, correct, distractors, explanation) => {
  const wrong = distractors.map(([text]) => text);
  const wrongRationales = distractors.map(([, rationale]) => rationale);
  return { ...baseItem(topicCode, prompt, correct, wrong, explanation), wrongRationales };
};

export const sculpture = {
  key: 'sculpture',
  subjectId: 'subj_wassce_sculpture',
  specId: 'spec_wassce_sculpture_brilla_b004',
  specificationCode: 'BRILLA-WASSCE-SCULPTURE-BETA-004',
  syllabusName: 'BrillaPrep transitional Sculpture beta content blueprint',
  assessmentInfo: 'Internal BrillaPrep evidence blueprint for the transitional Sculpture subject represented in current WAEC Ghana and NaCCA sources. It does not claim an official syllabus code, validity date or paper structure.',
  releaseSourceUrl: examinerReportUrl,
  contentLabel: 'Original BrillaPrep transitional Sculpture practice aligned to WAEC Ghana examiner evidence and NaCCA curriculum context; not official WAEC examination material or a copied past paper.',
  sources: [
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE for School Candidates 2026 final timetable', url: timetableUrl },
    { publisher: 'West African Examinations Council, Ghana', title: 'WASSCE 2023 Chief Examiners Report: Sculpture 2 and 3', url: examinerReportUrl },
    { publisher: 'National Council for Curriculum and Assessment, Ghana', title: 'Secondary education curriculum index', url: curriculumIndexUrl },
    { publisher: 'National Council for Curriculum and Assessment, Ghana', title: 'Art and Design Studio Curriculum', url: studioCurriculumUrl },
    { publisher: 'National Council for Curriculum and Assessment, Ghana', title: 'Art and Design Foundation Curriculum', url: foundationCurriculumUrl },
  ],
  topics: [
    ['SC-1', 'Cultural and historical sculpture', 'Interpret sculpture through credible cultural context, including animism in West African traditions and the representation of athletes in Greek sculpture.'],
    ['SC-2', 'Materials, terminology and studio safety', 'Use precise sculpture terminology, distinguish material properties and control dust, impact, heat and chemical hazards.'],
    ['SC-3', 'Modelling, coiling and terracotta preparation', 'Prepare terracotta clay systematically and build sound modelled or coiled forms through compatible joining and controlled drying.'],
    ['SC-4', 'Carving and relief processes', 'Plan carving and relief by reading grain, establishing depth, preserving allowances and refining form safely.'],
    ['SC-5', 'Indirect methods, moulding and casting', 'Distinguish direct and indirect production, then plan mould divisions, releases, gates, vents and controlled casting mixes.'],
    ['SC-6', 'Construction and assemblage', 'Join compatible components, stabilise structures and integrate fabricated or found elements into durable sculpture.'],
    ['SC-7', 'Design, figure, finishing and presentation', 'Control mass, negative space, gesture, anatomy, surface, lighting and display to communicate sculptural intent.'],
    ['SC-8', 'Professional practice, costing and conservation', 'Prepare an artist brochure, estimate costs, document condition, store work responsibly and present authentic process evidence.'],
  ],
  facts: [
    item('SC-1', 'In the study of traditional West African sculpture, what does animism most accurately describe?', 'A belief that spiritual agency or essence may inhabit people, animals, natural features or crafted objects', [
      ['The use of animal shapes only as decoration without spiritual meaning', 'Animal imagery may appear in animist traditions, but decorative subject matter alone does not define a belief about spiritual agency.'],
      ['A carving method in which every figure is made from a single log', 'Single-block carving describes a production choice; it does not explain the religious or philosophical relationship between spirit and matter.'],
      ['A style rule requiring all human figures to use naturalistic proportions', 'Naturalism is a representational approach, whereas animism concerns beliefs about spiritual presence and relationships in the world.'],
    ], 'Animism is a belief framework rather than a single visual style. In context, a sculpted figure, mask or object may mediate relationships among people, ancestors, spirits and the natural world.'),
    item('SC-1', 'How can animist belief influence the form and use of a traditional West African sculpture?', 'Material, symbols and form may be selected for an object intended to embody, address or mediate spiritual relationships', [
      ['The artist must copy the visible appearance of the subject with anatomical accuracy', 'Naturalistic observation can be used, but spiritual purpose may instead favour symbolic proportion, abstraction or prescribed attributes.'],
      ['The sculpture becomes meaningful only when displayed as an unsigned gallery object', 'Gallery display is one later context; many works gain meaning through community knowledge, ritual use, placement and custodianship.'],
      ['The maker chooses durable material solely to increase its market price', 'Durability and value may matter, but this explanation omits symbolic associations, ritual requirements and the intended social function.'],
    ], 'Cultural interpretation links appearance to purpose and context. Symbolic materials, emphasis, attachments, placement and performance can help an object serve as a focus or mediator of spiritual and communal relationships.'),
    item('SC-1', 'What is the most responsible way to interpret a West African ritual sculpture whose original community context is uncertain?', 'State the limits of the evidence and consult reliable provenance, community knowledge and contextual scholarship', [
      ['Use formal resemblance to a better-documented regional style as enough evidence to assign the same ritual function', 'Stylistic comparison can guide research, but related forms may serve different communities, dates and purposes, so resemblance cannot establish function by itself.'],
      ['Read an enlarged head and frontal gaze as universal proof that the figure represents an ancestor', 'Proportion and gaze can carry culturally specific meanings, but no single visual convention proves ancestor identity across all West African traditions.'],
      ['Adopt the earliest museum category as the community’s original name and use because it predates later scholarship', 'An early catalogue records one historical interpretation; without provenance or community evidence, its terminology and assigned function still require critical review.'],
    ], 'Responsible interpretation avoids presenting speculation as fact. Provenance, maker or community knowledge, documented use and reputable scholarship should be compared, with uncertainty clearly acknowledged.'),
    item('SC-1', 'Which feature is strongly associated with Classical Greek sculptures of athletes?', 'Idealised anatomical proportion combined with observed balance, movement and controlled pose', [
      ['Rigid frontal figures whose limbs never suggest weight transfer', 'Some earlier Greek figures are frontal, but Classical athletic sculpture is especially known for developed stance, balance and bodily movement.'],
      ['Figures defined mainly by attached ritual materials that activate a shrine', 'Ritual attachments occur in other sculptural traditions; they are not the defining formal concern of Classical Greek athletic representation.'],
      ['Bodies reduced to geometric signs with no reference to muscular structure', 'Greek artists could simplify forms, yet athletic works characteristically study anatomy, proportion and the body under tension or rest.'],
    ], 'Classical Greek athletic sculpture joined observation with idealisation. Proportion, musculature, contrapposto and implied action presented the trained body as both physically credible and culturally exemplary.'),
    item('SC-1', 'Why should a comparison of Greek athletic sculpture and West African ceremonial sculpture begin with context as well as appearance?', 'Their forms respond to different patrons, beliefs, functions, materials and viewing situations', [
      ['Both traditions can be judged accurately by anatomical realism alone', 'Anatomical realism is relevant to some works, but it cannot account for ritual efficacy, symbolism, performance or culturally specific ideals.'],
      ['A shared use of the human figure proves that both objects had the same purpose', 'Human imagery does not establish identical function; one work may commemorate athletic ideals while another mediates communal or spiritual relations.'],
      ['The older object must have influenced the newer one even without contact evidence', 'Chronology by itself does not demonstrate transmission; influence requires credible evidence of contact, exchange or documented artistic borrowing.'],
    ], 'Context prevents false equivalence. Comparing patronage, belief, function, material, setting and visual choices reveals both meaningful similarities and culturally specific differences.'),

    item('SC-2', 'What is an alloy used in sculpture?', 'A metallic material formed by combining two or more elements, with at least one being a metal', [
      ['A pure metal that has been polished until two colours appear', 'Polishing changes surface appearance but does not combine elements or create a new metallic material with modified properties.'],
      ['A mixture of clay and grog prepared for terracotta modelling', 'Clay and grog form a ceramic body, not a metallic material; their bonding and firing behaviour differ from alloy formation.'],
      ['A resin casting filled with bronze-coloured powder on its surface', 'A bronze-effect resin may imitate colour, but its polymer matrix is not thereby converted into a metal alloy.'],
    ], 'An alloy combines elements to obtain useful metallic properties. Brass, for example, combines copper and zinc; bronze commonly combines copper and tin, though exact compositions vary.'),
    item('SC-2', 'Which statement best defines high relief sculpture?', 'Forms project strongly from the background and may be undercut, while remaining attached to it', [
      ['Forms rise only slightly and preserve a shallow, nearly flat picture plane', 'That describes low relief, where projection is deliberately limited and modelling remains close to the background.'],
      ['The figure is completely detached and can be viewed equally from every side', 'A fully independent object is sculpture in the round, whereas high relief still retains a physical background connection.'],
      ['Lines are incised below the surface without any raised modelling', 'Incised or sunk relief cuts into the surface; high relief is distinguished by substantial outward projection of modelled forms.'],
    ], 'High relief creates strong projection, shadow and spatial overlap. Parts may approach three-dimensional form or be undercut, but the composition remains physically connected to its background plane.'),
    item('SC-2', 'Which control is most appropriate when dry sanding a material that may release fine mineral dust?', 'Use extraction or wet suppression with correctly selected respiratory protection', [
      ['Use general room ventilation alone while sanding close to the face', 'General airflow may not capture respirable particles at source and does not replace suitable extraction, suppression or fitted protection.'],
      ['Wear a loose cloth covering while compressed air clears the bench', 'A cloth is not verified respiratory protection, and compressed air redistributes settled dust into the breathing zone.'],
      ['Sweep the dry dust after each piece while other users remain nearby', 'Dry sweeping re-suspends fine particles and exposes others; controlled vacuuming or wet cleanup is the safer studio method.'],
    ], 'Fine mineral dust can remain airborne and reach deep into the lungs. Control begins at source through extraction or wet methods, supported by suitable ventilation, housekeeping and respiratory protection.'),
    item('SC-2', 'How should a small carving block be controlled before using a mallet and chisel?', 'Clamp it securely and keep hands outside the projected cutting path', [
      ['Brace it against the body while cutting away from the bench', 'Body bracing may appear stable, but a slipping edge or splitting block can direct force into the torso or supporting arm.'],
      ['Hold it with the free hand beside the intended chisel exit point', 'The exit area is precisely where the tool or a released chip may travel, placing the supporting hand in a foreseeable injury path.'],
      ['Rest it on a sandbag without checking whether the block can rotate', 'A sandbag can support some forms, but uncontrolled rotation under a mallet blow makes the cut unpredictable and unsafe.'],
    ], 'Secure workholding makes the response to each blow predictable. The maker should also inspect handles and edges, cut in a controlled direction and keep every hand beyond the possible travel of the tool.'),
    item('SC-2', 'What is required when applying a solvent-based sculpture coating?', 'Product-specific ventilation, ignition control and suitable protective equipment', [
      ['A fan with an unprotected motor placed inside concentrated vapour', 'Air movement may help only when equipment and discharge are suitable; an ignition-capable motor can create a fire or explosion hazard.'],
      ['A dust mask used in a closed room until the odour disappears', 'A particulate mask does not filter solvent vapour, and odour is not a reliable measure of safe airborne concentration.'],
      ['Rapid heating of the coated work to shorten the drying period', 'Heating can increase vapour concentration and ignition risk and may also cause coating defects or damage the substrate.'],
    ], 'The label and safety data determine ventilation, glove and respirator requirements, storage and disposal. Flames, sparks and unsuitable electrical equipment must be controlled around flammable vapour.'),

    item('SC-3', 'What is the primary function of an armature in a modelled sculpture?', 'Support the intended gesture and mass while modelling material is added', [
      ['Build the armature to the exact finished contour so only a uniformly thin skin of modelling material is required', 'An armature establishes support and major gesture with room for modelling; following the final contour too closely restricts revision and can expose the framework.'],
      ['Keep the same permanent rigid metal armature inside any clay model that may later be fired', 'A support suitable for moist modelling may be incompatible with firing because clay must shrink and heat must move safely through the body; firing plans govern armature choice.'],
      ['Set bilateral symmetry in the framework and rely on it instead of checking proportion as volumes are added', 'A symmetrical framework is only a starting guide; added masses, viewpoint and gesture still require repeated measurement and proportional correction.'],
    ], 'An armature is a supportive internal framework for pose, projecting parts and major proportions. Its strength, dimensions and compatibility must suit the medium and the intended final process.'),
    item('SC-3', 'How should a substantial fresh mass of clay be added to an existing leather-hard area?', 'Recondition the receiving area toward compatible moisture, score and slip both surfaces, compress the join, then dry the work slowly and evenly', [
      ['Score the leather-hard surface and attach very wet clay without moisture adjustment', 'Scoring improves keying, but a large moisture difference causes unequal shrinkage and can pull the fresh addition away as it dries.'],
      ['Saturate the entire leather-hard form until its surface becomes slurry', 'Flooding can weaken established walls and distort detail; controlled reconditioning is needed rather than uncontrolled soaking.'],
      ['Attach the fresh mass with thick slip and expose the join to rapid airflow', 'Slip cannot compensate for incompatible moisture, and fast local drying increases stress across the already vulnerable junction.'],
    ], 'A substantial join needs moisture compatibility as well as mechanical key. Controlled reconditioning, scoring, compatible slip and compression should be followed by support and slow, even drying to equalise shrinkage.'),
    item('SC-3', 'What distinguishes coiling as a clay-building method?', 'Successive rolled lengths of clay are joined and compressed to build the wall', [
      ['A solid block is reduced entirely with chisels and rasps', 'Removing material from a solid block is carving, whereas coiling is an additive ceramic construction process.'],
      ['Liquid slip is poured into an absorbent plaster mould', 'Slip casting forms a wall by depositing clay particles against a mould and does not build the form from rolled clay lengths.'],
      ['A flat slab is folded once and left with an uncompressed seam', 'Slab construction uses sheets, and any seam still requires preparation and compression; it is not the defining coiling sequence.'],
    ], 'Coils are arranged course by course and their contacts are compressed or blended sufficiently for structural continuity. Thickness, moisture and alignment must be controlled as height increases.'),
    item('SC-3', 'Which sequence best prepares naturally sourced clay for a sound terracotta body?', 'Dry and break it, remove impurities, slake and sieve it, dewater it, add suitable grog if needed, then knead or wedge it', [
      ['Remove visible debris, mix grog into the moist clay, wedge it, and form before slaking or sieving the finer body', 'Visible picking misses fine grit and organic matter, while adding grog before wet refinement makes consistent screening and moisture distribution harder to control.'],
      ['Slake the broken clay, dewater it to working stiffness, wedge it, and sieve the body only after it has firmed', 'Sieving belongs while the slaked body is fluid enough for impurities to separate; dewatering first traps coarse matter and makes later screening ineffective.'],
      ['Dry, crush and dry-sieve the clay, add water, and begin forming as soon as the surface feels plastic', 'Dry screening can remove coarse particles, but immediate forming leaves water unevenly distributed; slaking, dewatering and wedging develop a more uniform workable body.'],
    ], 'Systematic preparation produces an even workable body. Dry processing, slaking and sieving remove contaminants; dewatering, optional grog addition and wedging then control consistency and trapped air.'),
    item('SC-3', 'Why is grog added to some terracotta clay bodies?', 'It reduces drying shrinkage, improves dimensional stability and can help thick forms dry more evenly', [
      ['It acts as a glaze that seals the surface before firing', 'Grog is crushed fired ceramic mixed through the body; it does not melt into a continuous glaze at ordinary earthenware use.'],
      ['It makes unprepared clay completely plastic without adding water', 'Because grog is non-plastic, excessive amounts actually reduce plasticity even though they can improve structural stability.'],
      ['It removes every trapped air pocket without the need for wedging', 'Grog may open the body, but careful mixing, wedging and construction remain necessary to control laminations and trapped air.'],
    ], 'Grog is ground previously fired clay or ceramic. Its stable particles interrupt shrinkage, add tooth and assist drying, although amount and particle size must suit the desired surface and workability.'),

    item('SC-4', 'What makes carving a subtractive sculptural process?', 'Material is removed from a larger mass to reveal the intended form', [
      ['Prepared clay is added around a supporting armature', 'Adding clay is modelling, an additive process in which the form grows through the placement and compression of material.'],
      ['Molten or fluid material is introduced into a negative mould', 'Filling a mould is casting; the final form is obtained from a cavity rather than carved from the starting mass.'],
      ['Separate objects are selected and joined into one composition', 'Joining complete components is assemblage or construction, even if minor trimming occurs during fitting.'],
    ], 'Carving reveals form by planned removal from wood, stone or another solid. Because removed stock cannot simply be replaced, primary masses and finishing allowances must be established carefully.'),
    item('SC-4', 'Why are cuts in wood planned with attention to grain direction?', 'Working with supported fibres reduces uncontrolled splitting and tear-out', [
      ['The grain matters only when transparent finish is finally applied', 'Finish may reveal grain, but fibre direction affects cutting forces and breakage from the first roughing operation onward.'],
      ['Every cut should oppose rising grain so the edge lifts longer fibres', 'Cutting into rising fibres often levers them below the intended surface, producing tear-out rather than a clean controlled cut.'],
      ['Knots can be treated as if their fibres run parallel to the board', 'Fibres curve and interlock around knots, so the maker must change direction, reduce force or revise the design near them.'],
    ], 'Wood is directionally structured. Reading grain run-out, knots and checks helps the sculptor choose tool direction, preserve projecting parts and avoid splitting below the planned surface.'),
    item('SC-4', 'Which operation should precede the refinement of small carved details?', 'Remove waste progressively to establish the major masses, silhouette and depth', [
      ['Finish one facial feature as a scale reference before roughing the head, shoulders and body around it', 'A completed local feature can seem useful as a reference, but later changes to the major masses may shift its scale, position and relationship to the whole figure.'],
      ['Take the transferred outline directly to its final silhouette before establishing the main depth planes', 'A final outline controls only one view; carving must preserve allowance while front, side and depth relationships are established together.'],
      ['Rough, refine and sand each local area to completion before moving to the adjoining mass', 'Completing isolated zones too early removes correction allowance and can create discontinuities when neighbouring planes and volumes are subsequently adjusted.'],
    ], 'Primary masses and viewing silhouettes should be established before secondary forms and detail. Progressive removal keeps measurement possible and protects delicate features during heavy work.'),
    item('SC-4', 'How does a sculptor create convincing high relief without losing the background support?', 'Plan depth levels, overlap and selective undercutting while retaining sound attachments to the ground', [
      ['Keep every form at the same shallow projection from the background', 'Uniform shallow projection produces a low-relief effect and weakens the strong spatial hierarchy expected in high relief.'],
      ['Detach every projecting part so the composition becomes free-standing', 'Complete detachment converts the work toward sculpture in the round and removes the structural role of the relief ground.'],
      ['Carve the deepest undercuts first before locating the main figures', 'Premature deep cutting can remove essential support and makes proportion or depth corrections difficult later in the process.'],
    ], 'High relief depends on a controlled hierarchy from background to strongly projecting forms. Major planes come first; overlaps and undercuts are then developed without severing necessary structural bridges.'),
    item('SC-4', 'Why is a finishing allowance retained during rough carving?', 'It permits proportion correction and removal of tool marks without undersizing the form', [
      ['It is extra material intended to remain as an accidental ridge', 'An allowance is temporary stock for controlled refinement, not an unplanned surface feature in the finished sculpture.'],
      ['It replaces the need to measure the work from several viewpoints', 'Allowance creates room for correction but does not reveal errors; measurement and rotation remain necessary throughout carving.'],
      ['It allows deep mistakes to be hidden by cutting every surface further back', 'Further removal may worsen an error and distort relationships; retained stock supports limited, planned correction only.'],
    ], 'Roughing tools and heavy cuts are less precise than finishing operations. A controlled margin protects the designed surface until the main proportions are confirmed and fine refinement begins.'),

    item('SC-5', 'What is the indirect method of producing a sculpture?', 'A model is made first and transferred through a mould, pointing or other intermediate process into the final material', [
      ['The final material is shaped directly without a model or transfer stage', 'That is a direct method, such as carving the final block or modelling the completed work in its permanent material.'],
      ['The artist studies a reference but never makes an intermediate form', 'Using a reference can guide direct work; an indirect method specifically requires a physical transfer or reproduction stage.'],
      ['Found objects are displayed unchanged without joining or replication', 'Selection alone is not an indirect transfer process because no model is translated through a mould, guide or reproduction system.'],
    ], 'Indirect production separates the original model from the final material. Moulding and casting, enlargement from a maquette, or point-transfer carving can preserve and translate the designed form.'),
    item('SC-5', 'Why can a deep undercut prevent release from a rigid one-piece mould?', 'The mould locks mechanically behind the projecting form', [
      ['The undercut makes the mould material too absorbent to set', 'Absorbency affects some moulding processes, but the release problem comes from geometry blocking a single withdrawal direction.'],
      ['The casting becomes larger only because the mould has one section', 'Material change can affect size, yet a one-piece mould locks chiefly when its rigid opening cannot pass over a wider projection.'],
      ['The parting line becomes visible even though no mould division exists', 'A one-piece mould has no sectional seam; the problem is entrapment, not the appearance of a non-existent joint line.'],
    ], 'If the form widens behind the mould opening, a rigid shell cannot withdraw along one direction. Planned sections, flexible mould material or modification of the form are required.'),
    item('SC-5', 'What determines a suitable dividing line for a two-part mould?', 'Each section can withdraw cleanly while important detail and registration are preserved', [
      ['The line should cross the most prominent feature regardless of the seam', 'Crossing a focal feature may damage detail and create difficult cleanup even when the sections technically release.'],
      ['Both halves should contain the same number of undercuts', 'Equal undercut counts do not guarantee release; each undercut must be resolved relative to its section and draw direction.'],
      ['The division can be chosen after the first rigid half encloses the model', 'Parting design must be planned before enclosure so barriers, keys and withdrawal directions can be established safely.'],
    ], 'A good parting line balances release geometry, seam placement, mould strength and accurate reassembly. Registration keys help the sections return to the same relationship for casting.'),
    item('SC-5', 'What are the functions of a pouring sprue and vents in a closed mould?', 'The sprue admits casting material while vents allow displaced air and gases to escape', [
      ['Use the upper vents as inlets and keep the lower sprue mainly as a reservoir that feeds shrinkage after the pour', 'A separate riser may feed shrinkage in some casting systems, but the pouring sprue is the designed main inlet and vents are placed chiefly for air and gas escape.'],
      ['Make the sprue and vents the same diameter so liquid and displaced air can circulate through either channel during filling', 'Equal interchangeable channels do not control flow predictably; the main feed needs suitable capacity while smaller vents release air from likely trap points.'],
      ['Use one low sprue without separate vents because trapped air will return through the incoming material stream', 'Counterflow through a single inlet is unreliable in a closed mould; air collects at high or remote points unless dedicated vents provide escape paths.'],
    ], 'Casting material must enter continuously as air leaves the cavity. Correct gate size, sprue placement and vents at likely high points reduce bubbles, short fills and turbulent flow marks.'),
    item('SC-5', 'How should plaster normally be introduced when preparing a controlled casting mix?', 'Sift plaster gradually into measured clean water, allow it to wet, then mix gently', [
      ['Pour water into an unmeasured heap of plaster and beat it immediately', 'An uncontrolled ratio and vigorous mixing produce inconsistent strength and trap bubbles that can mark the casting surface.'],
      ['Add dry powder after the plaster begins to thicken to restore fluidity', 'Once chemical setting begins, added powder creates lumps and weak regions rather than restarting a uniform workable mix.'],
      ['Mix the plaster with dirty tool-washing water to slow its setting time', 'Residue and partially set particles can accelerate or disrupt setting and contaminate the detail of the new batch.'],
    ], 'Measured water and gradual sifting give repeatable consistency and full wetting. Gentle mixing limits entrained air, and the batch must be placed within its natural working time.'),

    item('SC-6', 'What should guide the choice of a joint between two different assemblage materials?', 'Expected loads, surface condition, material compatibility and dimensional movement', [
      ['The joint should be visually hidden even if it cannot transfer the load', 'Appearance matters, but a concealed connection that lacks strength or inspectability can fail without warning.'],
      ['A rigid adhesive is suitable whenever both surfaces feel smooth', 'Surface feel does not establish chemistry, movement tolerance or load capacity; preparation and compatibility testing are required.'],
      ['The strongest fastener is always best regardless of the weaker material', 'An oversized fastener can crush, split or concentrate stress in the weaker component instead of producing a durable joint.'],
    ], 'Connection design follows the load path and both materials. Fasteners, welds or adhesives must suit the surfaces, environment and expected movement without damaging the components.'),
    item('SC-6', 'Why does triangulation stiffen a lightweight constructed sculpture?', 'A triangle resists shape change unless a member or joint deforms', [
      ['The added diagonal increases dead weight, which presses the corner joints firmly enough to stop racking', 'The stiffness comes from geometric restraint and axial force in the diagonal, not from its weight pressing joints together; an unconnected heavy member adds little bracing.'],
      ['A triangular frame shares every force equally, so member size and joint stiffness no longer affect stability', 'Loads are not automatically equal, and a triangle can still fail when a member buckles or a joint cannot transfer the resulting tension and compression.'],
      ['One diagonal brace on the front plane automatically prevents racking and twisting on every plane of a three-dimensional frame', 'A brace stabilises the plane in which it works; a spatial construction may need triangulation or equivalent restraint on additional faces and against torsion.'],
    ], 'A diagonal converts a flexible frame into linked triangles. Their members carry axial forces instead of allowing corners to shear freely, provided the joints and sections are adequate.'),
    item('SC-6', 'Why must an upright assemblage be secured to an adequately sized base?', 'The footprint and connection must resist overturning from weight distribution and external forces', [
      ['A visually symmetrical upper form makes the base size irrelevant', 'Visual symmetry does not ensure the resultant centre of gravity remains within the support area under disturbance.'],
      ['A heavier top automatically lowers the combined centre of gravity', 'Adding high mass normally raises the centre of gravity and increases overturning demand on the base and connection.'],
      ['Surface adhesive alone can replace a designed mechanical load path', 'Adhesive may contribute, but capacity depends on substrate, peel forces, area and anchorage rather than surface contact alone.'],
    ], 'A stable sculpture keeps its combined centre of gravity within its support area and transfers overturning forces through a capable connection. Public display also requires foreseeable contact to be considered.'),
    item('SC-6', 'Which preparation is essential before welding components into a metal sculpture?', 'Remove incompatible coatings locally and control fumes, fire, radiation and hot-work hazards', [
      ['Weld through unknown painted coatings if the joint initially looks clean', 'Heating coatings can release toxic fumes and contamination may weaken the weld even when the visible surface seems acceptable.'],
      ['Use ordinary clear spectacles because the arc is visible only briefly', 'Clear lenses do not provide the required shade or face protection against arc radiation, sparks and hot particles.'],
      ['Cool the welded area immediately with bare wet hands to check alignment', 'Fresh welds and adjacent metal retain dangerous heat, while sudden cooling can also introduce distortion or cracking.'],
    ], 'Coatings and contamination are removed under controlled conditions. Extraction, welding screens, correct eye and body protection, fire watch and safe handling are planned before hot work begins.'),
    item('SC-6', 'Why are found-object surfaces cleaned and tested before adhesive assembly?', 'Contamination or weak coatings may stop the adhesive bonding to sound material', [
      ['Existing oil can act as a primer because it keeps the joint flexible', 'Oil commonly prevents wetting and adhesion, creating a weak boundary layer rather than a controlled flexible bond.'],
      ['A glossy coating proves the underlying object is chemically compatible', 'Gloss describes appearance, not coating integrity or adhesive chemistry; the coating itself may detach under load.'],
      ['A strong adhesive removes the need to identify the joined materials', 'Cure, surface preparation and long-term movement depend on the substrates, so product strength alone cannot establish suitability.'],
    ], 'A connection is only as reliable as its surface layers. Cleaning, appropriate abrasion and a small compatibility trial reveal contamination, coating failure or damaging chemical reaction before final assembly.'),

    item('SC-7', 'What is negative space in a sculpture?', 'The intentionally shaped open space around or within solid forms', [
      ['The hidden core inside a completely solid modelling mass', 'An inaccessible interior may affect construction, but negative space is perceived as open spatial form around or through the work.'],
      ['An unfinished patch that must be filled before display', 'Open space can be a deliberate compositional element rather than evidence that material or finish is missing.'],
      ['The written interpretation positioned beside the sculpture', 'A label supplies information, while negative space belongs to the spatial relationship among the sculpture and its surroundings.'],
    ], 'Openings and intervals shape silhouette, rhythm, movement and viewing paths. Negative space is therefore designed together with mass rather than treated as unused emptiness.'),
    item('SC-7', 'How can gesture be strengthened in a group-figure relief without distorting anatomy?', 'Establish the action line, weight-bearing relationships and major anatomical landmarks before details', [
      ['Enlarge every moving limb equally while ignoring the torso and pelvis', 'Uniform enlargement may create emphasis, but it breaks the anatomical chain that makes the action believable.'],
      ['Finish facial features first and fit the body into the remaining area', 'Starting with small details can trap the composition before pose, overlap and weight transfer are resolved.'],
      ['Use identical upright poses for all figures and rely on texture for motion', 'Texture can add energy, but repeated vertical poses do not communicate varied direction, balance or interaction convincingly.'],
    ], 'Gesture grows from the action line and the relation of head, rib cage, pelvis and supporting limbs. Checking these masses early preserves anatomical logic while allowing expressive emphasis.'),
    item('SC-7', 'How can a sculptor test whether an apparently balanced form is physically stable?', 'Check that the projected centre of gravity remains within the support area under expected conditions', [
      ['Compare only the visible colours on opposite sides of the work', 'Colour can affect visual balance, but it does not measure mass distribution or resistance to physical overturning.'],
      ['Assume bilateral symmetry guarantees stability on any base', 'A symmetrical object can still have a high centre of gravity, narrow footprint or weak attachment that makes it unstable.'],
      ['Increase the plinth height until the composition appears lighter', 'A taller support changes viewing and may increase consequences of a fall; it does not correct the sculpture’s load path.'],
    ], 'Physical equilibrium depends on mass and support geometry, not visual balance alone. The base, attachment and foreseeable contact should be assessed for the intended display environment.'),
    item('SC-7', 'Why is a protective surface finish tested on a concealed area or sample first?', 'It may alter colour, gloss, adhesion or the underlying material', [
      ['The trial confirms catalogue colour; adhesion and material compatibility are already assured when the label names the substrate', 'A generic substrate label cannot account for porosity, ageing, preparation or earlier coatings, so colour matching alone is not an adequate compatibility test.'],
      ['The trial identifies how heavy a coat can conceal surface variation, even if gloss and reversibility are not assessed', 'Hiding variation may change the intended surface and does not show whether the coating bonds safely, remains stable or can be removed without harm.'],
      ['The trial selects the shortest touch-dry time, which is sufficient evidence that the finish will remain bonded after curing', 'Touch-dry time is only an early handling indicator; adhesion, colour shift and material interaction can change during full curing and later ageing.'],
    ], 'A trial reveals visual and chemical compatibility before an irreversible application. It also helps the maker refine preparation, application thickness and drying conditions.'),
    item('SC-7', 'How should a plinth and lighting support presentation of a sculpture?', 'Provide stable viewing conditions that reinforce scale, form and intended emphasis', [
      ['Use the narrowest plinth so the work appears to float despite instability', 'A floating effect cannot justify inadequate support; footprint and connection must safely carry the sculpture first.'],
      ['Aim strong light from one direction without checking glare or lost detail', 'Directional light can reveal form, but uncontrolled glare and blocked shadows may conceal surfaces or distort interpretation.'],
      ['Place the sculpture above normal sight lines regardless of intended viewpoint', 'Height should follow the planned viewer relationship; arbitrary elevation can hide important forms and alter scale.'],
    ], 'Presentation affects safety and meaning. Plinth dimensions, sight lines, background and controlled light should reveal mass, texture and negative space while respecting the intended viewpoint.'),

    item('SC-8', 'Which information belongs in a concise professional artist brochure?', 'Artist name, contact details, short statement, selected work images with captions, and relevant exhibition or studio information', [
      ['Only a price list and decorative background without identifying the artist', 'Prices can be included, but a brochure that omits authorship, contact and work context cannot perform its basic professional purpose.'],
      ['Every process photograph taken, printed without selection or captions', 'Process evidence belongs in a portfolio; an effective brochure edits images and captions to communicate clearly within limited space.'],
      ['A copied biography of another sculptor whose style appears similar', 'Using another maker’s biography misrepresents authorship and gives readers no reliable information about the featured artist.'],
    ], 'An artist brochure is an edited communication tool. Clear identity, accessible contact, a concise practice statement and accurately captioned images help an audience understand and follow up on the work.'),
    item('SC-8', 'How is the direct cost of casting material estimated for a sculpture edition?', 'Multiply measured material per cast by unit cost and the planned number of casts, then allow for justified waste', [
      ['Multiply the price of one supplier pack by the number of casts, even when each pack yields material for several casts', 'Charging a complete pack to every cast repeatedly overstates consumption; pack price must first be converted to a cost per measured unit of usable material.'],
      ['Divide the total measured material by its unit price, then add the waste percentage as a currency amount', 'Material cost requires multiplication by price per unit; dividing reverses the rate, and a waste percentage must be applied to a defined material quantity or cost base.'],
      ['Cost one measured cast and add a waste allowance, but use that figure for the whole edition without multiplying by edition size', 'A per-cast estimate remains a unit cost; the planned number of casts must be included before the total material requirement for the edition is known.'],
    ], 'A defensible estimate connects measured consumption, supplier price and edition quantity. Documented waste, labour, mould cost and shared overhead can then be added separately and transparently.'),
    item('SC-8', 'What is the purpose of a condition report before moving or conserving a sculpture?', 'Record existing materials, cracks, losses, repairs and surface changes with dated images', [
      ['Assign blame for every mark before the object has been examined', 'The report establishes observable baseline evidence; responsibility can be considered only after comparison and investigation.'],
      ['Replace material identification with an estimated sale price', 'Market value does not reveal structural weakness, coating sensitivity or the handling requirements the report must document.'],
      ['Authorise cleaning as soon as dust appears on the surface', 'Dust may be noted, but treatment should follow material assessment, testing and appropriate conservation judgement.'],
    ], 'A dated written and photographic baseline distinguishes existing features from later damage. It supports packing, handling, treatment planning and accountability appropriate to the object’s materials.'),
    item('SC-8', 'Which storage practice best protects a fragile mixed-media sculpture?', 'Support strong load-bearing points in a stable environment and provide a clear handling plan', [
      ['Rest the work on its broadest visible plane over uniform foam, assuming the largest area is also the strongest support', 'Surface area alone does not reveal the internal load path; a broad shell or decorated plane may deform unless support is placed beneath verified structural points.'],
      ['Seal the complete work tightly in polyethylene with desiccant so one enclosure can control every component material', 'Mixed materials can require different humidity and ventilation conditions, while an unmonitored sealed microclimate may overdry one component or trap moisture near another.'],
      ['Detach projecting parts for compact storage even when their joints were not designed for repeated assembly', 'Unplanned dismantling can abrade finishes, loosen original joints or lose alignment; removable components should be identified and handled through a documented plan.'],
    ], 'Conservation storage considers load paths, abrasion, dust, light, humidity, temperature and access. Packaging and handling should not introduce new structural or surface risks.'),
    item('SC-8', 'Which portfolio evidence most convincingly demonstrates original sculptural development?', 'Dated sketches, maquette trials, process images, decisions and critical evaluation linked to the final work', [
      ['Final photographs and a retrospective artist statement that describes the process only after completion', 'A retrospective account can explain intent, but without dated working evidence it cannot independently demonstrate the sequence of experiments, revisions and authorship.'],
      ['A sequence of undated process photographs without captions because the visible changes are expected to explain each decision', 'Images can show stages, yet absent dates and annotations leave material choices, rejected alternatives and reasons for revision unclear to the reviewer.'],
      ['Referenced artist images and technical notes without maquette trials or evidence of revisions to the student’s own work', 'Research and technical knowledge support development, but they do not show how the student tested, transformed and evaluated ideas in an original sculptural process.'],
    ], 'Authentic process evidence connects idea, research, experiments, revisions and outcome. Captions and reflection make the maker’s decisions, technical learning and authorship visible to a reviewer.'),
  ],
};
