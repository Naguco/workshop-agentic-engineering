const cds = require('@sap/cds');
const ai = require('../srv/lib/ai');
const { summarizeProject, _buildTeamLine, _buildActivitiesLines, _setClientFactory } = ai;

describe('summarizeProject', () => {
  afterEach(() => {
    _setClientFactory(null);
    jest.restoreAllMocks();
  });

  it('builds a prompt that includes project name and returns AI response', async () => {
    const mockRun = jest.fn().mockResolvedValue({ getContent: () => 'Test summary.' });
    _setClientFactory(() => ({ run: mockRun }));

    cds.db = {
      run: jest.fn()
        .mockResolvedValueOnce({ ID: 'test-id', name: 'Alpha Project', description: 'Desc', startDate: '2026-01-01', endDate: '2026-12-31', statusName: 'In Progress' })
        .mockResolvedValueOnce([{ name: 'Task A', statusName: 'Overdue', dueDate: '2026-06-01' }])
        .mockResolvedValueOnce([{ memberName: 'Alice' }, { memberName: '' }])
    };

    const req = { params: [{ ID: 'test-id' }], error: jest.fn() };
    const result = await summarizeProject(req);

    expect(result).toBe('Test summary.');
    expect(req.error).not.toHaveBeenCalled();
  });

  it('falls back to member count when all memberNames are empty', () => {
    const members = [{ memberName: '' }, { memberName: '' }];
    expect(_buildTeamLine(members)).toBe('2 members');
  });

  it('returns named members when defaultFullName is present', () => {
    const members = [{ memberName: 'Alice' }, { memberName: '' }];
    expect(_buildTeamLine(members)).toBe('Alice');
  });

  it('handles no activities gracefully', () => {
    expect(_buildActivitiesLines([])).toBe('No activities');
  });

  it('formats activities correctly', () => {
    const activities = [{ name: 'Task A', statusName: 'Overdue', dueDate: '2026-06-01' }];
    expect(_buildActivitiesLines(activities)).toBe('- Task A: Overdue (due 2026-06-01)');
  });

  it('calls req.error when AI Core throws', async () => {
    _setClientFactory(() => ({
      run: jest.fn().mockRejectedValue(new Error('AI Core unavailable'))
    }));

    cds.db = {
      run: jest.fn()
        .mockResolvedValueOnce({ ID: 'test-id', name: 'X', description: '', startDate: null, endDate: null, statusName: 'Not Started' })
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
    };

    const req = { params: [{ ID: 'test-id' }], error: jest.fn() };
    await summarizeProject(req);

    expect(req.error).toHaveBeenCalledWith(500, expect.stringContaining('AI Core unavailable'));
  });
});
