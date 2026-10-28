const cds = require('@sap/cds');
const {
    readSFSF_User,
    createEmployee,
    updateEmployee,
    deleteChildren,
    deleteUnassignedEmployees,
    beforeSaveProject,
    afterSaveProject
} = require('./lib/handlers');
const { summarizeProject } = require('./lib/ai');

module.exports = cds.service.impl(async function () {

    const {
        Project,
        Member,
        SFSF_User,
    } = this.entities;

    this.on('READ', SFSF_User, readSFSF_User);

    // Member

    this.before('CREATE', Member, createEmployee);
    
    this.before('UPDATE', Member, updateEmployee);
    this.after('UPDATE', Member, deleteUnassignedEmployees);
    
    this.before('DELETE', Member, deleteChildren);
    this.after('DELETE', Member, deleteUnassignedEmployees);
    
    // Project
    
    this.before('DELETE', Project, deleteChildren);
    this.after('DELETE', Project, deleteUnassignedEmployees);

    this.before('SAVE', Project, beforeSaveProject);
    this.after('SAVE', Project, afterSaveProject);

    this.on('summarize', Project, summarizeProject);

});
