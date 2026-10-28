const cds = require('@sap/cds');

const AI_MODEL = 'gpt-4o-mini';
const AI_DESTINATION = 'aicore';

let _clientFactory = null;

async function _getClient() {
    if (_clientFactory) return _clientFactory(AI_MODEL);
    const { OrchestrationClient } = await import('@sap-ai-sdk/orchestration');
    return new OrchestrationClient(
        {
            promptTemplating: {
                model: { name: AI_MODEL }
            }
        },
        {},
        { destinationName: AI_DESTINATION }
    );
}

function _setClientFactory(factory) {
    _clientFactory = factory;
}

function _buildTeamLine(members) {
    const names = members.map(m => m.memberName).filter(n => n && n.trim());
    if (names.length === 0) return `${members.length} members`;
    return names.join(', ');
}

function _buildActivitiesLines(activities) {
    if (!activities || activities.length === 0) return 'No activities';
    return activities.map(a => `- ${a.name}: ${a.statusName} (due ${a.dueDate})`).join('\n');
}

async function summarizeProject(req) {
    try {
        const projectId = req.params[0].ID;
        const db = cds.db;

        const project = await db.run(
            SELECT.one.from('sfsf.projman.model.db.Project')
                .columns(['ID', 'name', 'description', 'startDate', 'endDate', 'status.name as statusName'])
                .where({ ID: projectId })
        );

        if (!project) return req.reject(404, 'Project not found.');

        const activities = await db.run(
            SELECT.from('sfsf.projman.model.db.Activity')
                .columns(['name', 'status.name as statusName', 'dueDate'])
                .where({ parent_ID: projectId })
        );

        const members = await db.run(
            SELECT.from('sfsf.projman.model.db.Member')
                .columns(['member.defaultFullName as memberName'])
                .where({ parent_ID: projectId })
        );

        const teamLine = _buildTeamLine(members || []);
        const activitiesLines = _buildActivitiesLines(activities || []);

        const prompt = `You are a project management assistant. Summarize the following project status in 2-3 sentences in a clear, professional tone.

Project: ${project.name}
Description: ${project.description}
Start: ${project.startDate} | End: ${project.endDate}
Overall status: ${project.statusName}
Team: ${teamLine}
Activities:
${activitiesLines}`;

        const client = await _getClient();
        const response = await client.chatCompletion({
            messages: [{ role: 'user', content: prompt }]
        });
        return response.getContent();

    } catch (err) {
        req.error(500, err.message);
    }
}

module.exports = { summarizeProject, _buildTeamLine, _buildActivitiesLines, _setClientFactory };
