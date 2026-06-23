async function findMembersByGroup() {
    const membersList = [];

    const maxTermResult = await execute('select max(term_id) from dict_member_term');
    const maxTerm = maxTermResult[0]["max(term_id)"];

    const maxRoleResult = await execute('select count(*) from dict_member_role');
    const maxRole = maxRoleResult[0]["count(*)"];

    for (let i = 1; i <= maxRole; i++) {
        const membersByRoleList = [];

        for (let j = maxTerm; j > 0; j--) {
            const members = await findMembersByRoleAndByTerm(i, j);
            if (members != null) {
                membersByRoleList.push(members);
            }
        }

        membersList.push(membersByRoleList);
    }

    return membersList;
}

async function findCurrentMembersByGroup() {
    const membersList = [];

    const latestTerms = await execute(`
        select role_id, max(term_id) as term_id
        from member_view
        group by role_id
        order by role_id;
    `);

    for (const role of latestTerms) {
        const members = await findMembersByRoleAndByTerm(role.role_id, role.term_id);
        if (members != null) {
            membersList.push(members);
        }
    }

    return membersList;
}

async function findHomeMembersByGroup() {
    const membersList = await findCurrentMembersByGroup();
    const founderMembers = await findMembersByRoleAndByTerm(1, 1);

    if (founderMembers != null) {
        membersList.push(founderMembers);
    }

    return membersList;
}

async function findAllMemberGroups() {
    return await findMembersByGroup();
}

async function findFormerMembersByGroup() {
    const membersList = [];

    const maxRoleResult = await execute('select count(*) from dict_member_role');
    const maxRole = maxRoleResult[0]["count(*)"];

    for (let i = 1; i <= maxRole; i++) {
        const currentTermResult = await execute(`
            select max(term_id) as term_id
            from member_view
            where role_id = ${i};
        `);

        if (currentTermResult == null) {
            continue;
        }

        const currentTerm = currentTermResult[0].term_id;
        const formerTermResult = await execute(`
            select distinct term_id
            from member_view
            where role_id = ${i}
              and term_id < ${currentTerm}
            order by term_id desc;
        `);
        const membersByRoleList = [];

        if (formerTermResult != null) {
            for (const term of formerTermResult) {
                const members = await findMembersByRoleAndByTerm(i, term.term_id);
                if (members != null) {
                    membersByRoleList.push(members);
                }
            }
        }

        if (membersByRoleList.length) {
            membersList.push(membersByRoleList);
        }
    }

    return membersList;
}

async function findMembersByRoleAndByTerm(role_id, term_id) {
    const query =  `
        select *
        from member_view
        where role_id = ${role_id} 
          and term_id = ${term_id}
        order by pinyin;
    `;
    return await execute(query);
}
