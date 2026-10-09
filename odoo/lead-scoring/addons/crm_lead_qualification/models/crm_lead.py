from odoo import api, fields, models
from odoo.exceptions import ValidationError


class CrmLead(models.Model):
    _inherit = "crm.lead"

    qualification_target_sector = fields.Boolean(string="Target sector")
    qualification_employee_count = fields.Integer(string="Company size")
    qualification_demo_requested = fields.Boolean(string="Demo requested")
    qualification_business_email = fields.Boolean(string="Business email verified")
    qualification_contact_date = fields.Date(string="Last meaningful contact")
    qualification_score = fields.Integer(compute="_compute_qualification", string="Qualification score")
    qualification_reasons = fields.Text(compute="_compute_qualification", string="Score breakdown")
    qualification_priority = fields.Selection(
        [("0", "Low"), ("1", "Medium"), ("2", "High"), ("3", "Very High")],
        compute="_compute_qualification", string="Suggested priority",
    )

    @api.constrains("qualification_employee_count", "qualification_contact_date")
    def _check_qualification_inputs(self):
        today = fields.Date.context_today(self)
        for lead in self:
            if lead.qualification_employee_count < 0:
                raise ValidationError(self.env._("Company size cannot be negative."))
            if lead.qualification_contact_date and lead.qualification_contact_date > today:
                raise ValidationError(self.env._("Contact date cannot be in the future."))

    @api.depends("qualification_target_sector", "qualification_employee_count",
                 "qualification_demo_requested", "qualification_business_email",
                 "qualification_contact_date")
    @api.depends_context("tz")
    def _compute_qualification(self):
        today = fields.Date.context_today(self)
        for lead in self:
            recent = bool(lead.qualification_contact_date and
                          0 <= (today - lead.qualification_contact_date).days <= 7)
            rules = [
                (lead.qualification_target_sector, 25, self.env._("Target sector")),
                (10 <= lead.qualification_employee_count <= 250, 20, self.env._("Company size: 10–250")),
                (lead.qualification_demo_requested, 30, self.env._("Demo requested")),
                (lead.qualification_business_email, 10, self.env._("Business email verified")),
                (recent, 15, self.env._("Contact within seven days")),
            ]
            score = sum(weight for matches, weight, _label in rules if matches)
            lead.qualification_score = score
            lead.qualification_reasons = "\n".join(
                f"+{weight}: {label}" for matches, weight, label in rules if matches
            ) or self.env._("No qualification signals yet.")
            lead.qualification_priority = str(sum(score >= threshold for threshold in (25, 50, 75)))

    def action_apply_qualification_priority(self):
        self.check_access("write")
        for lead in self:
            lead.priority = lead.qualification_priority
        return True
