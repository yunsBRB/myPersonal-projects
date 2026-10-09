from datetime import timedelta

from odoo import fields
from odoo.exceptions import AccessError, ValidationError
from odoo.tests import TransactionCase, tagged
from odoo.tests.common import new_test_user


@tagged("post_install", "-at_install")
class TestQualification(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.lead = cls.env["crm.lead"].create({"name": "Qualification test"})

    def test_empty_score(self):
        self.assertEqual(self.lead.qualification_score, 0)
        self.assertEqual(self.lead.qualification_priority, "0")

    def test_full_score_preserves_probability(self):
        self.lead.write({
            "qualification_target_sector": True,
            "qualification_employee_count": 50,
            "qualification_demo_requested": True,
            "qualification_business_email": True,
            "qualification_contact_date": fields.Date.today(),
        })
        probability = self.lead.probability
        self.assertEqual(self.lead.qualification_score, 100)
        self.lead.action_apply_qualification_priority()
        self.assertEqual(self.lead.priority, "3")
        self.assertEqual(self.lead.probability, probability)

    def test_contact_boundary(self):
        self.lead.qualification_contact_date = fields.Date.today() - timedelta(days=7)
        self.assertEqual(self.lead.qualification_score, 15)
        self.lead.qualification_contact_date = fields.Date.today() - timedelta(days=8)
        self.assertEqual(self.lead.qualification_score, 0)

    def test_employee_boundaries(self):
        for size, score in ((9, 0), (10, 20), (250, 20), (251, 0)):
            self.lead.qualification_employee_count = size
            self.assertEqual(self.lead.qualification_score, score)

    def test_invalid_inputs(self):
        for values in ({"qualification_employee_count": -1},
                       {"qualification_contact_date": fields.Date.today() + timedelta(days=1)}):
            with self.assertRaises(ValidationError), self.cr.savepoint():
                self.lead.write(values)

    def test_sales_record_rules_apply(self):
        salesperson = new_test_user(self.env, login="qualification_sales", groups="sales_team.group_sale_salesman")
        other = new_test_user(self.env, login="qualification_other", groups="sales_team.group_sale_salesman")
        self.lead.user_id = other
        with self.assertRaises(AccessError):
            self.lead.with_user(salesperson).action_apply_qualification_priority()
