/** @odoo-module **/
import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";

export class ScoreField extends Component {
    static template = "crm_lead_qualification.ScoreField";
    static props = { ...standardFieldProps };
    get score() {
        return Math.max(0, Math.min(100, this.props.record.data[this.props.name] || 0));
    }
}
registry.category("fields").add("crm_lead_qualification_score", {
    component: ScoreField,
    supportedTypes: ["integer"],
});
