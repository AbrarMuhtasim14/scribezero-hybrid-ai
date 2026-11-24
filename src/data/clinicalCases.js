export const CLINICAL_CASES = [
  {
    id: 'case-spine-01',
    title: 'Acute Lumbar Radiculopathy (L5-S1)',
    specialty: 'Orthopedics / Spine',
    patient: {
      name: 'Johnathan Doe',
      age: 48,
      dob: '1978-04-12',
      gender: 'Male',
      mrn: 'MRN-784920'
    },
    chiefComplaint: 'Severe lower back pain radiating down left posterior thigh to lateral foot for 4 days.',
    vitals: {
      bp: '138/84 mmHg',
      hr: '76 bpm',
      rr: '14 /min',
      temp: '98.6 °F',
      spo2: '99% room air'
    },
    rawTranscript: `Patient is Johnathan Doe, 48-year-old male, DOB 04/12/1978, MRN 784920. 
Chief complaint: Acute exacerbation of severe lower lumbar pain with radiating sharp shooting pain along the left posterior thigh and lateral calf down into the lateral foot, ongoing for 4 days following lifting a 60-pound generator. 
Pain rated 8 out of 10 on numeric scale, worsened by coughing, Valsalva, and seated posture, slightly relieved when lying supine with hips flexed. 
Mild paresthesias in the left L5 and S1 distribution. Denies bowel or bladder dysfunction, urinary retention, or saddle anesthesia. 
Vitals today: Blood pressure 138 over 84, heart rate 76, respirations 14, temperature 98.6 Fahrenheit, oxygen saturation 99% on room air. 
Physical exam findings: Lumbar spine with moderate paraspinal spasm. Positive straight leg raise on the left at 35 degrees with radicular reproduction; negative on the right. Left Achilles deep tendon reflex is 1+ hypoactive compared to 2+ brisk on right. Motor strength shows 4/5 weakness on left extensor hallucis longus during great toe dorsiflexion. Sensation diminished to light touch along left lateral foot border.
Current medications: Lisinopril 20mg daily for essential hypertension. Patient has taken OTC Ibuprofen 800mg TID over the past 3 days with minimal relief.
Assessment: Acute left L5-S1 lumbar disc herniation with severe radiculopathy (sciatica); essential hypertension.
Plan: 
1. Order Urgent Lumbar Spine MRI without intravenous contrast.
2. Prescribe oral Methylprednisolone dose pack (Medrol Dosepak) tapering over 6 days for neural inflammation.
3. Discontinue high-dose OTC Ibuprofen; initiate Meloxicam 15mg once daily with food. Flag potential NSAID and Lisinopril interaction regarding blood pressure control and renal perfusion.
4. Referral to physical therapy for core stabilization and McKenzie protocol once acute spasm subsides.
5. Strict red-flag return precautions given for progressive motor weakness or bowel/bladder sphincter disturbance.`
  },
  {
    id: 'case-pulm-02',
    title: 'Acute Exacerbation of COPD with Bronchitis',
    specialty: 'Pulmonology / Emergency',
    patient: {
      name: 'Sarah M. Jenkins',
      age: 66,
      dob: '1960-11-23',
      gender: 'Female',
      mrn: 'MRN-330194'
    },
    chiefComplaint: 'Worsening shortness of breath, productive purulent cough, and wheezing x 5 days.',
    vitals: {
      bp: '168/98 mmHg',
      hr: '102 bpm',
      rr: '26 /min',
      temp: '100.8 °F',
      spo2: '88% RA -> 93% on 2L NC'
    },
    rawTranscript: `Patient is Sarah M. Jenkins, 66-year-old female, DOB 11/23/1960, MRN 330194. 
Chief complaint: Progressive worsening dyspnea on exertion and frequent productive cough with thick yellow-green sputum over the past 5 days. 
Patient has a 45 pack-year smoking history. Currently unable to walk from bedroom to kitchen without severe air hunger. Using rescue Albuterol MDI every 2 hours at home with minimal relief. 
Vitals on presentation: Blood pressure 168/98, heart rate 102 tachycardic, respirations 26 tachypneic, temperature 100.8 degrees Fahrenheit, SpO2 88% on ambient air, improved to 93% on 2 liters nasal cannula.
Exam: Patient sitting in tripod position with mild accessory muscle use and pursed-lip breathing. Chest auscultation reveals diffuse bilateral expiratory wheezing with coarse bibasilar rhonchi. No jugular venous distention. No peripheral pedal edema.
Current medications: Tiotropium (Spiriva) 18mcg inhaled once daily, Amlodipine 10mg PO daily, Metformin 500mg BID.
Assessment: 
1. Acute exacerbation of chronic obstructive pulmonary disease (COPD) with acute purulent bronchitis.
2. Stage 2 hypertension, currently exacerbated by respiratory distress and frequent beta-agonist use.
Plan:
1. Start Prednisone 40mg PO daily for 5 days.
2. Prescribe Azithromycin 500mg PO day 1, followed by 250mg daily on days 2 through 5.
3. In-clinic Duoneb nebulizer treatment (Ipratropium 0.5mg / Albuterol 2.5mg), prescribe home nebulizer therapy every 4 to 6 hours as needed.
4. Titrate supplemental nasal cannula oxygen to target oxygen saturation between 88% and 92% to avoid hypercapnic respiratory drive suppression.
5. Order STAT 2-view chest radiography to rule out focal lobar pneumonia. Follow-up clinic appointment in 48 hours or transfer to ED if work of breathing deteriorates.`
  },
  {
    id: 'case-cardio-03',
    title: 'Paroxysmal Atrial Fibrillation with RVR',
    specialty: 'Cardiology',
    patient: {
      name: 'Eleanor Vance',
      age: 72,
      dob: '1954-03-05',
      gender: 'Female',
      mrn: 'MRN-912044'
    },
    chiefComplaint: 'Sudden onset irregular heart palpitations, lightheadedness, and mild dyspnea x 3 hours.',
    vitals: {
      bp: '112/74 mmHg',
      hr: '136 bpm (irregular)',
      rr: '18 /min',
      temp: '98.4 °F',
      spo2: '97% room air'
    },
    rawTranscript: `Patient is Eleanor Vance, 72-year-old female, DOB 03/05/1954, MRN 912044.
Chief complaint: Acute onset rapid irregular fluttering in chest accompanied by mild lightheadedness, exertional fatigue, and chest tightness that began 3 hours ago while gardening. Denies true syncope, orthopnea, or diaphoresis.
Vitals: Blood pressure 112 over 74, heart rate irregularly irregular varying between 125 and 145 beats per minute, respirations 18, temperature 98.4, oxygen saturation 97% on ambient air.
Diagnostic tests: 12-lead electrocardiogram demonstrates Atrial Fibrillation with Rapid Ventricular Response at 136 bpm, narrow QRS complex, no ischemic ST segment elevation or acute depression.
Physical examination: Irregularly irregular cardiac rhythm with variable S1 intensity, no S3 or S4 gallop, no systolic ejection murmur. Peripheral pulses irregular with pulse deficit. Lungs clear to bilateral auscultation. Neurological exam intact with no focal deficits.
Current medications: Warfarin (Coumadin) 5mg PO daily (most recent INR 2.4 measured 5 days ago), Lisinopril 10mg daily for hypertension.
Assessment:
1. Paroxysmal Atrial Fibrillation with Rapid Ventricular Response (RVR), hemodynamically stable.
2. CHA2DS2-VASc score calculated at 4 points (Age 72 = 1, Female = 1, Hypertension = 1, Vascular = 0) indicating high stroke risk requiring continuous therapeutic systemic anticoagulation.
Plan:
1. Intravenous Diltiazem (Cardizem) 15mg slow IV bolus administered over 2 minutes for ventricular rate control; prepare second bolus of 20mg at 15 minutes if heart rate remains above 110 bpm.
2. Initiate continuous Diltiazem infusion at 5mg/hr titrated up to 15mg/hr targeting resting ventricular rate under 100 bpm.
3. Continue therapeutic Warfarin regimen; draw STAT INR, serum Troponin I, comprehensive metabolic panel, serum magnesium, and TSH.
4. Continuous telemetry cardiac monitoring. Cardiology consult requested for long-term rate versus rhythm control strategy and transthoracic echocardiogram to evaluate left atrial dimension and ejection fraction.`
  },
  {
    id: 'case-endo-04',
    title: 'Type 2 Diabetes with Peripheral Neuropathy & Nephropathy',
    specialty: 'Endocrinology / Primary Care',
    patient: {
      name: 'Robert C. Sterling',
      age: 58,
      dob: '1968-08-19',
      gender: 'Male',
      mrn: 'MRN-552817'
    },
    chiefComplaint: 'Poor glycemic control with fasting sugars >200 mg/dL and burning dysesthesias in feet.',
    vitals: {
      bp: '144/88 mmHg',
      hr: '72 bpm',
      rr: '14 /min',
      temp: '98.2 °F',
      spo2: '98% room air'
    },
    rawTranscript: `Patient is Robert C. Sterling, 58-year-old male, DOB 08/19/1968, MRN 552817.
Chief complaint: Follow-up evaluation for poorly controlled type 2 diabetes mellitus and escalating painful burning dysesthesias in bilateral feet in a stocking distribution, predominantly nocturnal. Patient logs morning fasting glucose levels consistently between 190 and 240 mg/dL. Reports persistent polydipsia and nocturia three times nightly. Denies chest pain, claudication, or vision changes.
Vitals: Blood pressure 144/88, pulse 72, respirations 14, BMI 33.4 kg/m2.
Laboratory review: Glycated hemoglobin HbA1c is 9.4% (elevated from 8.2% six months ago). Spot urine microalbumin-to-creatinine ratio is elevated at 145 mcg/mg confirming microalbuminuria / early diabetic kidney disease. Estimated GFR is 78 mL/min/1.73m2.
Physical examination: Inspection reveals dry skin on bilateral feet without active ulceration, calluses, or erythema. 10g Semmes-Weinstein monofilament testing abnormal with loss of protective sensation at 4 of 10 sites on bilateral plantar surfaces. Vibratory sensation impaired at bilateral great toes using 128Hz tuning fork. Posterior tibial and dorsalis pedis pulses palpated at 2+ bilaterally.
Current medications: Metformin 1000mg PO BID, Glipizide 10mg PO daily, Atorvastatin 40mg PO daily.
Assessment:
1. Type 2 diabetes mellitus with poor glycemic control, with diabetic polyneuropathy and microalbuminuria.
2. Diabetic sensorimotor peripheral polyneuropathy.
3. Early stage diabetic nephropathy.
Plan:
1. Discontinue Glipizide to reduce hypoglycemia risk and glycemic variability.
2. Initiate SGLT2 inhibitor Empagliflozin (Jardiance) 10mg PO once daily in the morning to provide renal and cardiovascular protection and lower blood glucose.
3. Add Losartan 25mg PO daily to mitigate glomerular hypertension and reduce urinary albumin excretion; monitor serum creatinine and potassium in 4 weeks.
4. Initiate Duloxetine (Cymbalta) 30mg PO daily for diabetic neuropathic pain management, titrating to 60mg in 2 weeks.
5. Refer to podiatry for comprehensive diabetic foot inspection and certified diabetes care educator for continuous glucose monitoring (CGM) sensor onboarding. Recheck HbA1c and basic metabolic profile in 3 months.`
  }
];
