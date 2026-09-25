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

// Workload-balanced Auto-Assignment Algorithm
export function autoAssignTeamMembers(projects = [], teamMembers = TEAM_MEMBERS) {
  const result = {};

  const rolesConfig = [
    { key: 'emailDeveloper', optionsKey: 'emailDeveloper' },
    { key: 'campaignBuilder', optionsKey: 'campaignBuilder' },
    { key: 'emailQA', optionsKey: 'emailQA' },
    { key: 'campaignQA', optionsKey: 'campaignQA' },
    { key: 'audience', optionsKey: 'audience' },
    { key: 'coe', optionsKey: 'coe' }
  ];

  rolesConfig.forEach(({ key, optionsKey }) => {
    const candidateList = teamMembers[optionsKey] || [];
    if (candidateList.length === 0) return;

    // Calculate current active workload per candidate
    const workload = {};
    candidateList.forEach(name => { workload[name] = 0; });

    (projects || []).forEach(p => {
      if (p.status === 'Completed' || p.status === 'Cancelled' || p.status === 'Deferred') return;
      const assigned = p[key];
      if (!assigned) return;

      const names = Array.isArray(assigned)
        ? assigned
        : typeof assigned === 'string'
        ? assigned.split(/[,|]/).map(s => s.trim())
        : [];

      names.forEach(n => {
        const cleanName = n.split(' ')[0];
        candidateList.forEach(cand => {
          if (cand === n || cand.startsWith(cleanName) || n.startsWith(cand)) {
            workload[cand] = (workload[cand] || 0) + 1;
          }
        });
      });
    });

    // Select candidate with lowest current workload
    let leastLoaded = candidateList[0];
    let minVal = workload[leastLoaded] || 0;

    for (const cand of candidateList) {
      const val = workload[cand] || 0;
      if (val < minVal) {
        minVal = val;
        leastLoaded = cand;
      }
    }

    result[key] = leastLoaded;
  });

  return result;
}

