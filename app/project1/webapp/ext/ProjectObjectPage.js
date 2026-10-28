sap.ui.define(["sap/m/MessageBox"], function (MessageBox) {
    "use strict";

    return {
        generateSummary: async function (oContext) {
            const oOp = oContext.getModel().bindContext(
                "sfsf.projman.service.ProjectManager.summarize(...)",
                oContext
            );
            await oOp.execute();
            const sValue = oOp.getBoundContext().getObject().value;
            MessageBox.information(sValue, {
                title: "Project Summary",
                contentWidth: "40rem"
            });
        }
    };
});
