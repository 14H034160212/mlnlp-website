function buildActivityPeople(segments) {
    const people = Array.isArray(segments) ? segments : [];
    const chair = people.find((guest) => Number(guest.role) === 1) || null;

    return {
        chair,
        conferenceChair: chair,
        hosts: people.filter((guest) => Number(guest.role) === 2),
        speakers: people.filter((guest) => Number(guest.role) === 3)
    };
}

async function findActivity(type, typeId) {
    // 查询活动信息
    const activityQuery = `
        select *
        from activity
        where type = ${type}
          and type_id = ${typeId};
    `;
    const activityResult = await execute(activityQuery);
    const activity = activityResult[0]

    // 查询活动环节信息
    const activitySegmentQuery = `
        select *
        from activity_segment_view
        where activity_type = ${type}
          and activity_id = ${typeId};
    `;
    const activitySegments = await execute(activitySegmentQuery) || [];

    return {
        "activity": activity,
        "activitySegments": activitySegments,
        "activityPeople": buildActivityPeople(activitySegments)
    };
}

async function findActivitiesByPage(page, size){
    // 计算偏移量
    const offset = size * (page - 1);
    // 按页查询活动信息
    const ActivityQuery =  `
        select *
        from activity
        order by time desc
        limit ${size} offset ${offset};
    `;
    const activities = await execute(ActivityQuery);

    const guestList = [];
    const activityPeopleList = [];
    if (activities != null) {
        for (const activity of activities) {
            const activityType = activity["type"];
            const activityTypeId = activity["type_id"];

            const guestQuery = `
                select id, name, organization, title, role
                from activity_guest
                where activity_type = ${activityType}
                  and activity_id = ${activityTypeId};
            `;
            const segments = await execute(guestQuery) || [];

            guestList.push(segments);
            activityPeopleList.push(buildActivityPeople(segments));
        }
    }

    return {
        "activities": activities,
        "guestList": guestList,
        "activityPeopleList": activityPeopleList
    }
}

async function findActivityCount(){
    const query =  `
        select count(*)
        from activity;
    `;

    const count = await execute(query);
    return count[0]["count(*)"];
}
