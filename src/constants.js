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

// Workload-balanced & Skill-aware Auto-Assignment Algorithm
export function autoAssignTeamMembers(
  projects = [],
  teamMembers = TEAM_MEMBERS,
  targetProject = {},
  rules = {},
  resourceSkills = {},
  userProfiles = {},
  leaves = []
) {
  const result = {};
  const assignmentDetails = {};

  const enablePastHistory = rules.enablePastHistoryPriority !== false;
  const maxRush = rules.maxRushRequestsPerPerson !== undefined ? Number(rules.maxRushRequestsPerPerson) : 1;
  const maxComplex = rules.maxComplexRequestsPerPerson !== undefined ? Number(rules.maxComplexRequestsPerPerson) : 2;
  const enableSkills = rules.enableSkillMatching !== false;

  const targetRequester = (targetProject.requesterName || '').trim().toLowerCase();
  const targetLOB = (targetProject.lineOfBusiness || '').trim().toLowerCase();
  const targetCampaignTypeRaw = (targetProject.typeOfCampaign || '').trim();
  const targetTypeOfRequestRaw = (targetProject.typeOfRequest || '').trim();
  const targetCampaignType = targetCampaignTypeRaw.toLowerCase();
  const targetTypeOfRequest = targetTypeOfRequestRaw.toLowerCase();

  const targetStartStr = targetProject.startDate || targetProject.requestDate || targetProject.creationDate || new Date().toISOString().split('T')[0];
  const targetEndStr = targetProject.targetDate || targetProject.dueDate || targetStartStr;
  const projStart = new Date(targetStartStr);
  const projEnd = new Date(targetEndStr);

  // Role Routing Matrix Determination
  let requiredRoleKeys = null; // null means all roles if no specific rule matches
  const enableRoleRouting = rules.enableRoleRouting !== false;

  if (enableRoleRouting) {
    if (targetCampaignType === 'coe' || targetTypeOfRequest === 'coe') {
      requiredRoleKeys = ['coe'];
    } else if (targetCampaignType === 'service') {
      requiredRoleKeys = ['campaignBuilder', 'emailQA', 'campaignQA'];
    } else if (targetCampaignType === 'marketing') {
      if (
        targetTypeOfRequest === 'delivery' || 
        targetTypeOfRequest === 'delivery + campaign' ||
        targetTypeOfRequest === 'delivery+campaign'
      ) {
        requiredRoleKeys = ['emailDeveloper', 'emailQA', 'campaignBuilder', 'campaignQA'];
      } else if (
        targetTypeOfRequest === 'transaction message' ||
        targetTypeOfRequest === 'transactional message' ||
        targetTypeOfRequest === 'cmp templates' ||
        targetTypeOfRequest === 'cmp'
      ) {
        requiredRoleKeys = ['emailDeveloper'];
      } else if (
        targetTypeOfRequest === 'sms' ||
        targetTypeOfRequest === 'push notification' ||
        targetTypeOfRequest === 'push' ||
        targetTypeOfRequest === 'inapp notification' ||
        targetTypeOfRequest === 'in-app notification' ||
        targetTypeOfRequest === 'workflow'
      ) {
        requiredRoleKeys = ['campaignBuilder', 'campaignQA'];
      } else if (targetTypeOfRequest === 'audience') {
        requiredRoleKeys = ['audience'];
      }
    }
  }

  const rolesConfig = [
    { key: 'emailDeveloper', optionsKey: 'emailDeveloper', title: 'Email Developer' },
    { key: 'campaignBuilder', optionsKey: 'campaignBuilder', title: 'Campaign Builder' },
    { key: 'emailQA', optionsKey: 'emailQA', title: 'Email QA' },
    { key: 'campaignQA', optionsKey: 'campaignQA', title: 'Campaign QA' },
    { key: 'audience', optionsKey: 'audience', title: 'Audience' },
    { key: 'coe', optionsKey: 'coe', title: 'CoE' }
  ];

  rolesConfig.forEach(({ key, optionsKey, title }) => {
    // Check if role is required for this campaign & request type
    if (requiredRoleKeys !== null && !requiredRoleKeys.includes(key)) {
      result[key] = '';
      assignmentDetails[key] = {
        roleTitle: title,
        assigned: '',
        reason: `Not required for Campaign Type "${targetCampaignTypeRaw}" & Request Type "${targetTypeOfRequestRaw}"`
      };
      return;
    }
    const candidateList = teamMembers[optionsKey] || [];
    if (candidateList.length === 0) return;

    // Track metrics per candidate in candidateList
    const stats = {};
    candidateList.forEach(cand => {
      stats[cand] = {
        name: cand,
        activeCount: 0,
        rushCount: 0,
        complexCount: 0,
        historyCount: 0,
        skills: resourceSkills[cand] || [],
        disqualifiedReason: null
      };
    });

    // 1. Analyze existing projects to compute active workload, rush tasks, complex tasks, and history
    (projects || []).forEach(p => {
      const isFinished = p.status === 'Completed' || p.status === 'Cancelled' || p.status === 'Deferred';
      const assigned = p[key];
      if (!assigned) return;

      const names = Array.isArray(assigned)
        ? assigned
        : typeof assigned === 'string'
        ? assigned.split(/[,|]/).map(s => s.trim())
        : [];

      const pRequester = (p.requesterName || '').trim().toLowerCase();
      const pLOB = (p.lineOfBusiness || '').trim().toLowerCase();
      const pCampaignType = (p.typeOfCampaign || '').trim().toLowerCase();
      
      const isRushProject = p.priority === 'Urgent' || p.priority === 'Critical Business Impact' || p.isRush === true;
      const compStr = (p.taskComplexity || '').toLowerCase();
      const isComplexProject = compStr.includes('complex') || compStr === 'custom';

      names.forEach(n => {
        const cleanName = n.split(' ')[0];
        candidateList.forEach(cand => {
          if (cand === n || cand.startsWith(cleanName) || n.startsWith(cand)) {
            // Check History (both completed & active count as prior domain experience!)
            if (
              (targetRequester && pRequester && targetRequester === pRequester) ||
              (targetLOB && pLOB && targetLOB === pLOB) ||
              (targetCampaignType && pCampaignType && targetCampaignType === pCampaignType)
            ) {
              stats[cand].historyCount += 1;
            }

            // Check Active Workload & Capacity Caps
            if (!isFinished) {
              stats[cand].activeCount += 1;
              if (isRushProject) stats[cand].rushCount += 1;
              if (isComplexProject) stats[cand].complexCount += 1;
            }
          }
        });
      });
    });

    // 2. Evaluate disqualifications & scoring for candidates
    const eligibleCandidates = [];
    const cappedCandidates = [];

    candidateList.forEach(cand => {
      const st = stats[cand];

      // Check User Profile Disabled Status
      const profile = userProfiles[cand];
      if (profile && profile.status === 'Disabled') {
        st.disqualifiedReason = `User account disabled`;
        cappedCandidates.push(st);
        return;
      }

      // Check Leave Schedule Overlaps
      const activeLeave = (leaves || []).find(l => {
        if (l.status === 'Cancelled') return false;
        if (l.memberName.toLowerCase() !== cand.toLowerCase()) return false;
        const lStart = new Date(l.startDate);
        const lEnd = new Date(l.endDate || l.startDate);
        return (lStart <= projEnd) && (lEnd >= projStart);
      });

      if (activeLeave) {
        st.disqualifiedReason = `On Leave (${activeLeave.startDate} to ${activeLeave.endDate || activeLeave.startDate})`;
        cappedCandidates.push(st);
        return;
      }

      // Check Rush Cap
      if (st.rushCount >= maxRush && maxRush > 0) {
        st.disqualifiedReason = `Handling ${st.rushCount} active Rush request(s) (Cap: ${maxRush})`;
        cappedCandidates.push(st);
        return;
      }
      // Check Complex Cap
      if (st.complexCount >= maxComplex && maxComplex > 0) {
        st.disqualifiedReason = `Handling ${st.complexCount} active Complex request(s) (Cap: ${maxComplex})`;
        cappedCandidates.push(st);
        return;
      }

      // Candidate is eligible! Compute score
      // Score Formula: (History Boost * 15) - (Active Workload * 5)
      let score = 0;
      if (enablePastHistory && st.historyCount > 0) {
        score += Math.min(st.historyCount, 5) * 15;
      }
      score -= (st.activeCount * 5);

      st.score = score;
      eligibleCandidates.push(st);
    });

    // Sort eligible candidates by Score DESC, then Active Workload ASC
    eligibleCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.activeCount - b.activeCount;
    });

    let chosenCandidate = null;
    let choiceReason = '';

    if (eligibleCandidates.length > 0) {
      chosenCandidate = eligibleCandidates[0].name;
      const st = eligibleCandidates[0];
      const reasons = [];
      if (st.historyCount > 0 && enablePastHistory) {
        reasons.push(`Prior experience with ${targetLOB || targetRequester || 'client'} (${st.historyCount} previous tasks)`);
      }
      reasons.push(`Active Workload: ${st.activeCount} task(s)`);
      reasons.push(`Rush: ${st.rushCount}/${maxRush}, Complex: ${st.complexCount}/${maxComplex}`);
      choiceReason = reasons.join(' | ');
    } else {
      // Fallback: All candidates hit capacity caps! Pick non-disabled candidate with lowest active workload
      const availableFallbacks = candidateList.filter(cand => {
        const p = userProfiles[cand];
        return !p || p.status !== 'Disabled';
      });
      availableFallbacks.sort((a, b) => stats[a].activeCount - stats[b].activeCount);
      chosenCandidate = availableFallbacks[0] || candidateList[0];
      choiceReason = `Capacity Fallback (All candidates capped/on leave). Assigned to ${chosenCandidate} (Active Workload: ${stats[chosenCandidate].activeCount})`;
    }

    result[key] = chosenCandidate;
    assignmentDetails[key] = {
      roleTitle: title,
      assigned: chosenCandidate,
      reason: choiceReason,
      stats: stats[chosenCandidate]
    };
  });

  return result;
}

