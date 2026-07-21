async function findAllProjects() {
    const query = `
        select id,
               title,
               case
                   when github_repo = 'MLNLP-World/AI-Paper-Collector'
                       then '本项目提供了一套用于自动收集 AI 领域论文的脚本，可按研究方向持续追踪并整理最新成果。项目支持从多个来源获取论文信息，减少重复检索与人工归档的成本，帮助研究者更高效地构建和维护自己的论文资料库。'
                   else description
               end as description,
               html_url,
               github_repo,
               stars,
               forks
        from project
        where github_repo <> 'MLNLP-World/Awesome-LLM'
        order by stars desc;
    `;
    return await execute(query);
}
