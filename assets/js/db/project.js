async function findAllProjects() {
    const query = `
        select *
        from project
        where github_repo <> 'MLNLP-World/Awesome-LLM'
        order by stars desc;
    `;
    return await execute(query);
}
