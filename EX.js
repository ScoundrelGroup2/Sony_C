//<script>
$ex = {
    modalEdit: false,												//視窗是否為重新編輯-
    edit: false,														//明細表資料列是否已編輯-
    data: {},
    modalLoad: function () { },
    openModal: function (tr, btnText) {
        modal({
            title: "Detail",
            url: "Sony_EX_DetailModal.aspx",
            width: "90%",
            height: "90%",
            loadEvent: function loadEvent(modalElement) {
                //$(item).find("[name=tJSONData]").val()
                //設定視窗尚未成功帶回資料至主表中-
                document.windowEdit = false;
                if (tr.attr("data") != undefined) {
                    var dataObj = JSON.parse(tr.attr("data"));
                    modalElement.contentWindow.loading(dataObj);
                }

            },
            closeEvent: function closeEvent(outer) {
                if (!document.windowEdit && !$ex.modalEdit) {
                    tr.remove();
                }
                // else {
                //     tr.ReadingMode({
                //         filter: "[action=checkRow]",//過濾action=checkRow-
                //         //顯示文字處理-
                //         textHandler: {
                //             IncomeItem: function (text) {
                //                 //找出對應item_id之item_name-
                //                 return Common.ValueInJson($wi.fullIncomeItems, { item_id: text })[0].item_name;
                //             }
                //         }
                //     });
                //     //若資料列尚未有hover color設定-
                //     if (!tr.prop("colored")) {
                //         tr.DarkerStyle();
                //     }
                //     tr.prop("colored", true);
                // }
                // $("[name=TotalAmount]").val($wi.sumTotal().Thousandth());
                calTda();
                $detail.detail.target.find("tfoot").ReadingMode();
                $detail.detail.target.DetailStyling2().refresh();
                $('[name=DetailItem] [action=checkRow]').removeAttr("disabled");

            },
            buttons: [
                {
                    text: btnText,
                    css: "btn-primary",
                    callback: function (outer, btn) {
                        var r = {};
                        var data = outer.contentWindow.getData();
                        //設定視窗成功帶回資料至主表中-
                        document.windowEdit = true;

                        var form = $(Common.Iframe.ChildDoc("#modal-iframe"));	//選擇視窗-
                        var emptyFlag = false;												//是否有空值-


                        //欄位檢核-
                        form.find("#EXModal").find("input,select").filter(":visible").each(function () {
                            var t = $(this);
                            var label = t.parent().find("label").text().trim();
                            var name = t.Name();
                            var value = t.val();
                            if (!value && name != 'Remark') {
                                t.Validation(label + "未填寫");
                                emptyFlag = true;
                            }
                            else {
                                t.UnValidation();
                                r[name] = value;
                            }
                        });

                        if (!emptyFlag) {
                            //組合視窗填入之資料值 並顯示於前端-
                            $.each(r, function (name, value) {
                                var input = tr.find("[name=" + name + "]");
                                if (input.length > 0) {
                                    var td = input.closest("td");
                                    td.find("text").remove();
                                    input.val(value);
                                }
                            });
                            outer.close();
                            //將組合資料放入該資料列-
                            tr.prop("edit", true).attr("data", JSON.stringify(r));
                            SetItemData(tr, data);
                        }
                        else {
                            document.windowEdit = false;
                            outer.isLockButtons = false;
                            $(btn).removeClass("btn-loading");
                        }
                    }
                },
                {
                    text: "Back",
                    callback: function (outer) {
                        outer.close();
                    }
                }
            ]
        });
    },
    getCostCenter: function (dept) {
        return Common.GetTableData("Sony_CostCenter_Mapping", {
            DeptID: dept,
        });
    },
    // Cost Center
    bindCostCenterOption: function (deptID) {
        $("[name=CostCenter]").empty();
        $ex.getCostCenter(deptID).forEach((obj) => {
            var op = $(`<option></option>`).clone();
            op.val(obj.CostCenter).text(obj.CostCenter);
            $("[name=CostCenter]").append(op);
        });
    },
};
$().ready(function () {
    $('[name=ExpatriateName]').selectOrg({
        multiple: false,
        callback: function (data) {
            $("[name=StaffCode]").val(data.accountID);
            $("[name=ExpatriateName]").val(data.accountName);
            $("[name=Title]").val(data.title);
            let deptSelector = $("[name=Dept]");
            $('[name="Dept"]').empty();
            let memberDept = Common.GetTableData("F7Organ_LView_CurrMember", { accountid: data.accountID, Lang: 'zh-tw' });
            memberDept.map(function (o) {
                $("[name=Dept]").append(`<option value="${o.DeptID}">${o.DeptName}</option>`);
            });

            let selectedDept = $("[name=Dept]").val()
            $ex.bindCostCenterOption(selectedDept);
        }
    });

    $("[name=Dept]").change(function () {
        let selectedDept = $("[name=Dept]").val()
        $ex.bindCostCenterOption(selectedDept);
    })

    var styling = $detail.detail.target.DetailStyling2({
        checkbox: "[action=checkRow]",
        hasFirst: false,
        editable: false
    });

    styling.refresh();
    $detail.detail.clear();
    $detail.detail.target.find("tfoot").ReadingMode();

    //明細表新增列後事件-
    $detail.detail.addAfter(function (tr) {
        tr.css("cursor", "pointer");

        $ex.edit = null;
        $ex.data = null;

        $ex.modalEdit = false;
        $ex.openModal(tr, "Add");

        tr.click(function (e) {
            var t = $(this);
            if (!$(e.target).hasClass("custom-control")) {
                $ex.edit = t.prop("edit");
                $ex.data = t.attr("data");

                $ex.modalLoad = function (data, iframe) {
                    $.each(data, function (name, value) {
                        var input = iframe.find("[name=" + name + "]");
                        if (name == "Amount") {
                            value = value.Thousandth();
                        }
                        if (input.length > 0) {
                            input.val(value);
                            input.change();
                        }
                    });
                }
                $ex.openModal(t, "Update");
            }
        });

    });

    $detail.detail.delAfter(function () {
        calTda();
    })

    bpm.detail.setTemplate({
        detailId: "Detail",
        tempRowSelector: "[name=DetailItem]",
    });
    bpm.detail.setTemplate({
        detailId: "AggregatedDetail",
        tempRowSelector: "[name=AggregatedItem]",
    });

    //Detail 核取方塊全選/取消功能-
    $("#itemBoxAll").on("click", function () {
        $(this).closest("table").find("[name=DetailBox]").not(":first").prop("checked", $(this).prop("checked"));
    });

    //Detail 刪除項目 -delDetail
    $("#delDetail").click(function () {
        $("[name=DetailBox]:checked").each(function () {
            bpm.detail.deleteItem(this);
        });
        $("#itemBoxAll").prop("checked", false);
        PayInfoTotal();
    });

    bpm.handlerSend(function (info) {

        var detailData = $detail.detail.getViewDatas();
        let keysToDelete = ["FromTo", "DetailBox", "test"]; // 要刪除的 key

        detailData.forEach(obj => {
            keysToDelete.forEach(key => delete obj[key]);
        });
        //insert D表資料


        Common.InsertBPMDetail({
            requisitionID: bpm.formInfo.requisitionID,
            table: "FM7T_EX_D",
            itemList: JSON.stringify(detailData),
            done: function (data) {
                switch (data) {
                    case "success":
                        break;
                    default:
                        WrongAlert("新增明細表時發生錯誤 ! 未新增任何資料");
                        //sendFlag = false;
                        break;
                }
            }
        });
    })
}
)

function SetItemData(item, data) {
    if (data.TypeId == "5" || data.TypeId == "8") {
        $(item).find("[name=FromTo]").val("From " + data.FromDest + " To " + data.ToDest);
    }
    if (data.TypeId == "6") {
        $(item).find("[name=FromTo]").val("From " + data.FromDate + " To " + data.ToDate);
    }
    $(item).find("[name=Payee]").val(data.Payee);
    $(item).find("[name=ExpenseType]").val(data.ExpenseType);
    $(item).find("[name=ExpenseItem]").val(data.ExpenseItem);
    $(item).find("[name=ReciDate]").val(data.ReciDate);
    $(item).find("[name=Currency]").val(data.Currency);
    $(item).find("[name=Amount]").val(data.Amount);
    $(item).find("[name=ExchangeRate]").val(data.ExchangeRate);
    $(item).find("[name=TWDAmount]").val(data.TWDAmount);
    $(item).find("[name=Remark]").val(data.Remark);


}

function calTda() {
    //計算Total Daily Allowance
    var Total = 0;

    $('#detail [name=DetailItem]').each(function () {
        if ($(this).find('[name=TWDAmount]').val() != "") {
            var amount = parseInt($(this).find('[name=TWDAmount]').val().replace(/,/g, ''));
            Total += amount;
            $('#detail [name=TotalAmt]').val(Common.Thousandth(Total));
            $('#detail [from=TotalAmt]').text(Common.Thousandth(Total));
        }
    })
}
//</script>