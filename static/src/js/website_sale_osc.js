$(document).ready(function () {

    function getFormData(form) {
        var fields = form.serializeArray();
        var form_data = {};
        jQuery.each(fields, function (i, field) {
            form_data[field.name] = field.value;
        });

        return form_data;
    }

    $("#delivery_carrier").find("input[name='delivery_type']").click(function (ev) {
        var carrier_id = $(ev.currentTarget).val();
        var acquirer_id = $("#payment_method").find("div.oe_sale_acquirer_button:not(:hidden)").data('id');
        var $address_form = $("form[action='/shop/checkout']");
        var address_data = getFormData($address_form);
        address_data['acquirer_id'] = acquirer_id;
        $.post("/shop/checkout", address_data, function (data) {
            window.location.href = '/shop/payment?carrier_id=' + carrier_id;
        })
        .fail(function () {
            alert("Please check again if all fields are filled out correctly");
        });
    });

    $("#payment_method").off("click", 'button[type="submit"],button[name="submit"]');

    $("#payment_method").on("click", 'button[type="submit"],button[name="submit"]', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var terms = $('input[name=terms_conditions]');
        if (terms.length) {
            if (!terms.is(':checked')) {
                terms.closest('div').addClass('alert alert-danger');
                return false;
            }
        }

        var $form = $(ev.currentTarget).parents('form');
        var acquirer_id = $(ev.currentTarget).parents('div.oe_sale_acquirer_button').first().data('id');

        var carrier_id = $("#delivery_carrier").find("input:checked[name='delivery_type']").val();

        var $address_form = $("form[action='/shop/checkout']");
        var address_data = getFormData($address_form);

        address_data['acquirer_id'] = acquirer_id;
        address_data['carrier_id'] = carrier_id;

        $.post("/shop/checkout", address_data, function (data) {
            var data_address_form = $(data).find("form[action='/shop/checkout']");
            if (data_address_form.length && data_address_form.find(".has-error").length) {
                $("form[action='/shop/checkout']").replaceWith(data_address_form);
            } else {
                if (!acquirer_id) {
                    return false;
                }
                openerp.jsonRpc('/shop/payment/transaction/' + acquirer_id, 'call', {}).then(function (data) {
                    $form.submit();
                });
            }

        })
        .fail(function () {
            alert("Please check again if all fields are filled out correctly");
        });

    });

    // Opens modal view when clicking on terms and condition link in
    // onestepcheckout, it loads terms and conditions page and render only wrap
    // container content in modal body
    $('.checkbox-modal-link').on('click', 'a', function (ev) {
        var elm = $(ev.currentTarget)
            , title = elm.attr('title')
            , page = elm.attr('data-page-id');

        $.get(page, function (data) {
            var modalBody = $(data).find('main .oe_structure').html();
            if (title) {
                $('#checkbox-modal .modal-header h4').text(title);
            }
            if (!modalBody) {
                modalBody = '<div class="container"><div class="col-md-12"><p>Informationen text</p></div></div>';
            }
            $('#checkbox-modal .modal-body').html(modalBody);
            $('#checkbox-modal').modal();
            return false;
        });
    });

});