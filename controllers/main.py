# -*- coding: utf-8 -*-
##############################################################################
#
# Odoo, an open source suite of business apps
# This module copyright (C) 2015 bloopark systems (<http://bloopark.de>).
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
from openerp.addons.website_sale.controllers.main import website_sale
from openerp.addons.web import http
from openerp.addons.web.http import request


class website_sale(website_sale):

    mandatory_billing_fields = ["name", "phone", "email", "street2", "zip", "city", "country_id"]
    optional_billing_fields = ["street", "state_id", "vat", "vat_subjected"]
    mandatory_shipping_fields = ["name", "phone", "street", "zip", "city", "country_id"]
    optional_shipping_fields = ["state_id"]

    @http.route()
    def checkout(self, **post):
        res = super(website_sale, self).checkout(**post)

        # Get acquirers, order and deliveries for the qcontext
        payment_qcontext = super(website_sale, self).payment().qcontext

        if post:
            values = self.checkout_values(post)
            if 'name' in values["checkout"]:
                self.checkout_form_save(values["checkout"])

            confirm_order = super(website_sale, self).confirm_order(**post)
            res.qcontext.update(confirm_order.qcontext)

            if 'acquirer_id' in post:
                request.session['acquirer_id'] = int(post['acquirer_id'])

        res.qcontext.update({'acquirer_id': request.session.get('acquirer_id')})

        super(website_sale, self).payment(**post)

        res.qcontext.update(payment_qcontext)

        if 'deliveries' not in res.qcontext:
            return request.redirect("/shop/cart")

        return res

    @http.route()
    def payment(self, **post):
        super(website_sale, self).payment(**post)
        return request.redirect("/shop/checkout")

    @http.route(['/page/terms_and_conditions/'], type='http', auth="public", website=True, multilang=True)
    def checkout_terms(self, **opt):
        """Function for terms of condition."""
        return request.website.render('website_sale_osc.checkout_terms')
