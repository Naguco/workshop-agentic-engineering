const cds = require('@sap/cds');
// cds.test() MUST be the first cds call (CAP docs: cds.test dos-and-donts).
const { POST, expect } = cds.test(__dirname + '/../..');

describe('AI Core live integration (aicore)', () => {
  const PID = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    // Seed one project so summarizeProject passes its 404 gate and reaches the
    // real AI Core call (Review Focus #3). Members/activities left empty — the
    // prompt builders handle empty arrays.
    await INSERT.into('sfsf.projman.model.db.Project').entries({
      ID: PID,
      name: 'PoC Project',
      description: 'Live AI Core integration test',
    });
  });

  it('summarize returns a non-empty live completion from AI Core', async () => {
    // Bound action on the draft-enabled Project (active instance). The action's
    // fully-qualified name uses the service schema namespace.
    const { status, data } = await POST(
      `/projman/Project(ID=${PID},IsActiveEntity=true)/sfsf.projman.service.ProjectManager.summarize`,
      {}
    );

    expect(status).to.equal(200);
    expect(data.value).to.be.a('string');
    expect(data.value.trim().length).to.be.greaterThan(0); // a real completion, not empty/placeholder
  });
});

