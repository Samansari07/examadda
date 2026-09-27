export type SyllabusTopic={subject:string;topics:string[]};
export type ExamSyllabus={slug:string;title:string;status:"official-structured";sourceUrl:string;lastVerified:string;subjects:SyllabusTopic[]};

export const syllabusBySlug:Record<string,ExamSyllabus>={
"upsc-cse-2026":{slug:"upsc-cse-2026",title:"UPSC Civil Services Examination — structured syllabus",status:"official-structured",sourceUrl:"https://upsc.gov.in/examinations",lastVerified:"2026-09-27",subjects:[
{subject:"General Studies Paper I",topics:["Indian Heritage & Culture","History of India and Indian National Movement","Indian and World Geography — physical, social and economic","Indian Society and Diversity","Governance and Constitution","Polity and governance","Social justice and welfare","International relations","Economic and social development","Sustainable development","Poverty and inclusion","Demographics","General issues on environmental ecology, biodiversity and climate change","General science"]},
{subject:"General Studies Paper II — CSAT",topics:["Comprehension","Interpersonal and communication skills","Logical reasoning","Analytical ability","Decision making and problem solving","General mental ability","Basic numeracy","Data interpretation","Class X level mathematics"]},
{subject:"Civil Services Main — Essay",topics:["Essay writing","Multiple dimensions of a topic","Coherent argument and structure","Relevant examples and evidence","Concise expression"]},
{subject:"GS Paper I — Mains",topics:["Indian culture","Modern Indian history","Freedom struggle","Post-independence consolidation","World history","Indian society","Women and population issues","Urbanisation","Globalisation","Physical geography","Natural resources","Geophysical phenomena"]},
{subject:"GS Paper II — Mains",topics:["Constitution","Federalism","Parliament and state legislatures","Executive and judiciary","Constitutional bodies","Governance","Transparency and accountability","Civil services","Welfare schemes","Health and education","Poverty and hunger","International relations"]},
{subject:"GS Paper III — Mains",topics:["Indian economy","Inclusive growth","Government budgeting","Agriculture","Food processing","Land reforms","Infrastructure","Science and technology","Environment","Disaster management","Internal security","Cyber security","Money laundering","Border management"]},
{subject:"GS Paper IV — Ethics",topics:["Ethics and human interface","Human values","Attitude","Aptitude and foundational values","Emotional intelligence","Moral thinkers and philosophers","Public service values","Probity in governance","Codes of ethics","Case studies"]},
{subject:"Optional Subject",topics:["One UPSC-approved optional subject","Subject-specific Paper I","Subject-specific Paper II","Current official optional syllabus must be followed"]}]
},
"upsc-ese-2027":{slug:"upsc-ese-2027",title:"UPSC Engineering Services Examination — structured syllabus",status:"official-structured",sourceUrl:"https://www.upsc.gov.in/examinations/Engineering%20Services%20%28Preliminary%29%20Examination%2C%202027",lastVerified:"2026-09-27",subjects:[
{subject:"Paper I — General Studies & Engineering Aptitude",topics:["Current national and international issues relevant to engineering","Logical reasoning and analytical ability","Engineering mathematics and numerical analysis","General principles of design, drawing and safety","Standards and quality practices","Energy and environment","Basics of project management","Material science and engineering","ICT based tools and applications in engineering","Ethics and values in engineering profession"]},
{subject:"Civil Engineering",topics:["Engineering mechanics","Strength of materials","Structural analysis","Design of concrete and steel structures","Fluid mechanics","Hydraulics","Hydrology","Irrigation engineering","Geotechnical engineering","Foundation engineering","Transportation engineering","Environmental engineering","Surveying","Construction planning and management"]},
{subject:"Mechanical Engineering",topics:["Engineering mechanics","Mechanics of materials","Theory of machines","Machine design","Thermodynamics","Fluid mechanics","Heat transfer","IC engines","Refrigeration and air conditioning","Power plant engineering","Renewable energy","Production engineering","Industrial engineering and management","Engineering materials"]},
{subject:"Electrical Engineering",topics:["Circuit theory","Electrical and electronic measurements","Electrical machines","Power systems","Power electronics","Control systems","Electrical materials","Analog and digital electronics","Microprocessors and microcontrollers","Communication fundamentals","Utilization of electrical energy"]},
{subject:"Electronics & Telecommunication Engineering",topics:["Electronic devices and circuits","Digital electronics","Microprocessors and microcontrollers","Communication systems","Electromagnetic theory","Computer engineering","Signal processing","Control systems","Microwave engineering","Measurements and instrumentation","Network theory"]}]
},
"nda-ii-2026":{slug:"nda-ii-2026",title:"NDA & NA — structured syllabus",status:"official-structured",sourceUrl:"https://upsc.gov.in/examinations",lastVerified:"2026-09-27",subjects:[
{subject:"Mathematics",topics:["Algebra","Matrices and determinants","Trigonometry","Analytical geometry","Differential calculus","Integral calculus","Differential equations","Vector algebra","Statistics and probability"]},
{subject:"General Ability Test — English",topics:["Grammar and usage","Vocabulary","Comprehension","Cohesion and correct expression"]},
{subject:"General Ability Test — General Knowledge",topics:["Physics","Chemistry","General science","Social studies","History","Geography","Current events"]}]
},
"cds-ii-2026":{slug:"cds-ii-2026",title:"CDS — structured syllabus",status:"official-structured",sourceUrl:"https://upsc.gov.in/examinations",lastVerified:"2026-09-27",subjects:[
{subject:"English",topics:["Grammar","Vocabulary","Usage","Comprehension","Sentence arrangement","Error detection"]},
{subject:"General Knowledge",topics:["Current affairs","History","Geography","Polity","Economy","General science","Defence awareness"]},
{subject:"Elementary Mathematics",topics:["Arithmetic","Algebra","Trigonometry","Geometry","Mensuration","Statistics"]}]
},
"upsc-capf-2026":{slug:"upsc-capf-2026",title:"CAPF Assistant Commandants — structured syllabus",status:"official-structured",sourceUrl:"https://upsc.gov.in/examinations",lastVerified:"2026-09-27",subjects:[
{subject:"General Ability & Intelligence",topics:["Logical reasoning","Quantitative aptitude","Numerical ability","Data interpretation","General science","Current events","Indian polity","Economy","History","Geography"]},
{subject:"General Studies — Essay & Comprehension",topics:["Essay on security and national issues","Indian history and geography","Polity and economy","Security and human rights","Analytical comprehension","Precis writing","Counter-terrorism and internal security themes"]}]
},
"ssc-cgl-2026":{slug:"ssc-cgl-2026",title:"SSC CGL — structured syllabus",status:"official-structured",sourceUrl:"https://ssc.gov.in/",lastVerified:"2026-09-27",subjects:[
{subject:"General Intelligence & Reasoning",topics:["Analogies","Classification","Series","Coding-decoding","Venn diagrams","Space visualization","Problem solving","Critical thinking","Pattern folding","Embedded figures","Numerical reasoning"]},
{subject:"General Awareness",topics:["Current events","History","Culture","Geography","Economic scene","General policy","Scientific research","India and neighbouring countries"]},
{subject:"Quantitative Aptitude",topics:["Number system","Percentages","Ratio and proportion","Averages","Interest","Profit and loss","Discount","Partnership","Mixture and allegation","Time and distance","Time and work","Algebra","Geometry","Mensuration","Trigonometry","Data interpretation"]},
{subject:"English Comprehension",topics:["Vocabulary","Grammar","Sentence structure","Synonyms and antonyms","Error spotting","Fill in the blanks","Idioms and phrases","Reading comprehension","Cloze test","Sentence improvement"]},
{subject:"Tier-II Computer Knowledge",topics:["Computer basics","CPU","Input/output devices","Memory","Windows","Microsoft Office","Internet","Email","Networking basics","Cyber security"]},
{subject:"Tier-II Data Entry Speed Test",topics:["Data entry speed","Accuracy","Prescribed computer-based data entry task"]}]
},
"ssc-chsl-2026":{slug:"ssc-chsl-2026",title:"SSC CHSL — structured syllabus",status:"official-structured",sourceUrl:"https://ssc.gov.in/",lastVerified:"2026-09-27",subjects:[
{subject:"English Language",topics:["Spot the error","Fill in the blanks","Synonyms","Antonyms","Spellings","Idioms","One-word substitution","Sentence improvement","Active/passive","Direct/indirect speech","Cloze test","Comprehension"]},
{subject:"General Intelligence",topics:["Analogy","Classification","Series","Coding-decoding","Venn diagrams","Figural classification","Embedded figures","Pattern folding","Logical reasoning"]},
{subject:"Quantitative Aptitude",topics:["Number system","Arithmetic","Algebra","Geometry","Mensuration","Trigonometry","Statistical charts","Data interpretation"]},
{subject:"General Awareness",topics:["Current affairs","History","Culture","Geography","Economic scene","General policy","Scientific research","India and neighbouring countries"]},
{subject:"Computer Knowledge",topics:["Computer fundamentals","Operating systems","Word processing","Spreadsheets","Internet and email","Cyber security"]}]
},
"ssc-mts-2026":{slug:"ssc-mts-2026",title:"SSC MTS — structured syllabus",status:"official-structured",sourceUrl:"https://ssc.gov.in/",lastVerified:"2026-09-27",subjects:[
{subject:"Numerical & Mathematical Ability",topics:["Integers","Whole numbers","LCM and HCF","Decimals and fractions","BODMAS","Percentage","Ratio","Work and time","Average","Simple interest","Profit and loss","Discount","Area and perimeter","Distance and time","Graphs and data"]},
{subject:"Reasoning Ability & Problem Solving",topics:["Alpha-numeric series","Coding-decoding","Analogy","Directions","Similarities and differences","Jumbling","Problem solving","Non-verbal reasoning"]},
{subject:"General Awareness",topics:["History","Geography","Civics","Economics","General science","Environmental studies","Current affairs"]},
{subject:"English Language & Comprehension",topics:["Vocabulary","Grammar","Sentence structure","Synonyms","Antonyms","Reading comprehension"]}]
},
"ssc-je-2026":{slug:"ssc-je-2026",title:"SSC Junior Engineer — structured syllabus",status:"official-structured",sourceUrl:"https://ssc.gov.in/ro-nodal/",lastVerified:"2026-09-27",subjects:[
{subject:"General Intelligence & Reasoning",topics:["Analogy","Classification","Series","Coding-decoding","Venn diagrams","Problem solving","Judgment","Decision making","Visual memory"]},
{subject:"General Awareness",topics:["Current events","History","Culture","Geography","Economic scene","General policy","Scientific research"]},
{subject:"Civil Engineering",topics:["Building materials","Estimating and costing","Surveying","Soil mechanics","Hydraulics","Irrigation","Transportation","Environmental engineering","Theory of structures","Concrete technology","Steel design"]},
{subject:"Electrical Engineering",topics:["Basic concepts","Circuit law","Magnetic effect","AC fundamentals","Measurements","Electrical machines","Generation","Transmission and distribution","Estimation and costing","Utilization","Basic electronics"]},
{subject:"Mechanical Engineering",topics:["Theory of machines","Machine design","Engineering mechanics","Thermodynamics","IC engines","Refrigeration","Production engineering","Properties of materials","Fluid mechanics","Power plant engineering"]}]
},
"ssc-gd-2026":{slug:"ssc-gd-2026",title:"SSC GD Constable — structured syllabus",status:"official-structured",sourceUrl:"https://ssc.gov.in/ro-nodal/",lastVerified:"2026-09-27",subjects:[
{subject:"General Intelligence & Reasoning",topics:["Analogies","Similarities","Differences","Spatial visualization","Spatial orientation","Visual memory","Observation","Relationship concepts","Arithmetic reasoning","Figural classification","Number series","Non-verbal series"]},
{subject:"General Knowledge & General Awareness",topics:["Current events","India and neighbouring countries","Sports","History","Culture","Geography","Economic scene","General polity","Indian Constitution","Scientific research"]},
{subject:"Elementary Mathematics",topics:["Number system","Whole numbers","Decimals","Fractions","Arithmetic","Percentage","Ratio","Average","Interest","Profit and loss","Discount","Mensuration","Time and distance","Ratio and time","Time and work"]},
{subject:"English/Hindi",topics:["Basic comprehension","Vocabulary","Grammar","Sentence understanding","Reading comprehension"]}]
},
"ctet-2026":{slug:"ctet-2026",title:"CTET — structured syllabus",status:"official-structured",sourceUrl:"https://ctet.nic.in/information-bulletin/",lastVerified:"2026-09-27",subjects:[
{subject:"Child Development & Pedagogy",topics:["Child development","Concept of inclusive education","Understanding children with special needs","Learning and pedagogy","How children think and learn","Motivation and learning","Individual differences"]},
{subject:"Language I",topics:["Language comprehension","Pedagogy of language development","Reading","Grammar and language use","Learning and teaching language"]},
{subject:"Language II",topics:["Comprehension","Pedagogy of language development","Communication","Remedial teaching","Language skills"]},
{subject:"Mathematics — Paper I",topics:["Number","Geometry","Shapes and spatial understanding","Measurement","Data handling","Patterns","Mathematics pedagogy"]},
{subject:"Environmental Studies — Paper I",topics:["Family and friends","Food","Shelter","Water","Travel","Things we make and do","EVS pedagogy"]},
{subject:"Mathematics & Science — Paper II",topics:["Number system","Algebra","Geometry","Mensuration","Data handling","Food","Materials","Living world","Moving things","Electricity and circuits","Magnets","Natural phenomena","Natural resources","Science pedagogy"]},
{subject:"Social Studies/Social Science — Paper II",topics:["History","Geography","Social and political life","Constitution","Democracy","Resources","Government","Social science pedagogy"]}]
},
"neet-ug-2026":{slug:"neet-ug-2026",title:"NEET UG 2026 — structured syllabus",status:"official-structured",sourceUrl:"https://neet.nta.nic.in/documents/",lastVerified:"2026-09-27",subjects:[
{subject:"Physics",topics:["Units and measurements","Kinematics","Laws of motion","Work, energy and power","Rotational motion","Gravitation","Properties of bulk matter","Thermodynamics","Kinetic theory","Oscillations and waves","Electrostatics","Current electricity","Magnetic effects","Electromagnetic induction","Alternating current","Electromagnetic waves","Optics","Dual nature","Atoms and nuclei","Electronic devices"]},
{subject:"Chemistry",topics:["Some basic concepts","Atomic structure","Chemical bonding","Thermodynamics","Equilibrium","Redox reactions","Organic chemistry principles","Hydrocarbons","Solutions","Electrochemistry","Chemical kinetics","Surface chemistry","p-block","d- and f-block","Coordination compounds","Haloalkanes and haloarenes","Alcohols phenols ethers","Aldehydes ketones acids","Amines","Biomolecules"]},
{subject:"Biology",topics:["Diversity in living world","Structural organisation","Cell structure and function","Plant physiology","Human physiology","Reproduction","Genetics and evolution","Biology and human welfare","Biotechnology","Ecology and environment"]}]
},
"ugc-net-2026":{slug:"ugc-net-2026",title:"UGC-NET — structured syllabus framework",status:"official-structured",sourceUrl:"https://ugcnet.nta.ac.in/",lastVerified:"2026-09-27",subjects:[
{subject:"Paper I — Teaching & Research Aptitude",topics:["Teaching aptitude","Research aptitude","Comprehension","Communication","Mathematical reasoning","Logical reasoning","Data interpretation","Information and communication technology","People and environment","Higher education system"]},
{subject:"Paper II — Subject specific",topics:["Candidate-selected UGC-NET subject","Official subject-specific syllabus","Unit-wise concepts and theories","Subject-specific research and application areas","Current official subject syllabus must be followed"]}]
},
"jpsc-2026":{slug:"jpsc-2026",title:"JPSC Combined Civil Services — structured syllabus",status:"official-structured",sourceUrl:"https://www.jpsc.gov.in/",lastVerified:"2026-09-27",subjects:[
{subject:"Prelims Paper I — General Studies",topics:["History of India","Geography of India","Indian polity and governance","Indian economy","General science","Environment","Current affairs","Jharkhand history and culture","Jharkhand geography","Jharkhand economy","Jharkhand state administration"]},
{subject:"Prelims Paper II — General Studies",topics:["General aptitude","Reasoning","Numerical ability","Comprehension","Mental ability","General awareness"]},
{subject:"Mains — General Hindi & General English",topics:["Essay","Precis","Comprehension","Grammar","Translation","Vocabulary","Correct usage"]},
{subject:"Mains — General Studies",topics:["History","Geography","Polity","Economy","Science and technology","Environment","Current affairs","Jharkhand-specific studies"]},
{subject:"Mains — Optional / prescribed papers",topics:["Subject-specific papers according to the current JPSC notification and rules"]}]
}
};