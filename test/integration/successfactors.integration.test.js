const cds = require('@sap/cds');
// cds.test() MUST be the first cds call, before any cds submodule import,
// so cds.env + plugins load from the project root (CAP docs: cds.test dos-and-donts).
const { GET, expect } = cds.test(__dirname + '/../..');

describe('SuccessFactors live integration (PLTUserManagement)', () => {
  it('reads SFSF_User through the destination and returns a well-formed response', async () => {
    const { status, data } = await GET('/projman/SFSF_User', { params: { $top: 1 } });

    expect(status).to.equal(200);

    const rows = data.value;
    expect(rows).to.be.an('array');
    // Liveness guard: a connectivity/auth failure throws above (observed in spike as
    // "Could not find service binding of type 'destination'") rather than yielding [].
    // So reaching here with a 200 array means the live SuccessFactors call succeeded.
    // If rows exist, they must carry the projected SuccessFactors shape.
    if (rows.length) {
      expect(rows[0]).to.have.property('userId');
    }
  });
});
