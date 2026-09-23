export const TEAM_MEMBERS = {
  emailDeveloper: ['Subhasri', 'Mohanapriya', 'Sudharsanan', 'Jerrald', 'Meshak', 'Samrajkumar'],
  campaignBuilder: ['Indrajit', 'Ambarish', 'Shankar', 'Gowsalya', 'Dharshan', 'Sivashankar', 'Sathyaleka'],
  emailQA: ['Jagadesh', 'Niranjana'],
  campaignQA: ['Thiyagaraj', 'Suwetha'],
  audience: ['Nandha', 'Preeth'],
  coe: ['Sathya', 'Preetha']
};

export const ALL_RESOURCES = Array.from(new Set([
  ...TEAM_MEMBERS.emailDeveloper,
  ...TEAM_MEMBERS.campaignBuilder,
  ...TEAM_MEMBERS.emailQA,
  ...TEAM_MEMBERS.campaignQA,
  ...TEAM_MEMBERS.audience,
  ...TEAM_MEMBERS.coe
])).sort();

export const CAMPAIGN_OPS_RESOURCES = Array.from(new Set([
  ...TEAM_MEMBERS.emailDeveloper,
  ...TEAM_MEMBERS.campaignBuilder,
  ...TEAM_MEMBERS.emailQA,
  ...TEAM_MEMBERS.campaignQA
])).sort();

export const AUDIENCE_RESOURCES = [...TEAM_MEMBERS.audience].sort();
export const COE_RESOURCES = [...TEAM_MEMBERS.coe].sort();
