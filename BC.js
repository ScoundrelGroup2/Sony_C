<script>
    var $BC = {
        getPrevSerialID: function (accountId) {
            return Common.GetTableData(
                "Sony_View_BC_BANo",
                { "ApplicantID": accountId },
                { fields: ["SerialID", "RequisitionID", "Identify"] }
            );
        },
        appendBcSelector: function (data) {
            data.forEach(item => {
                //let bcNoOption = $(`<option value="${item.SerialID}" req="${item.RequisitionID}">${item.SerialID}</option>`).clone();
                let bcNoOption = $(`<option value="${item.RequisitionID}">${item.SerialID}</option>`).clone();
                bcNoOption.prop("data", item);
                $("[name=BANo]").append(bcNoOption);
            });
        },
        queryStringInfo: function () {
            // var queryList = base64decode(location.search.split("EinB64=")[1]).split("&");
            var obj = {}
            // queryList.forEach(function (str) {
            //     var k = str.split("=")[0];
            //     var v = str.split("=")[str.split("=").length - 1];
            //     if (k == "DiagramName") {
            //        v = decodeURIComponent(v);
            //     }
            //     obj[k] = v;
            // });
            obj["RequisitionID"] = $('[name=BANo]').val();
            obj["Identify"] = $('[name=PrevIdentify]').val();
            obj["DiagramName"] = "Business Trip Cancel Revise Application";
            return obj;
        },
        buildLocationSearch: function (obj) {
            // 將物件轉換為查詢字串
            var queryList = Object.keys(obj).map(function (key) {
                var value = key === "DiagramName" ? encodeURIComponent(obj[key]) : obj[key];
                return key + "=" + value;
            });

            var queryString = queryList.join("&");
            var encodedQuery = base64encode(queryString);

            return "?EinB64=" + encodedQuery;
        },
        base64encode: function (str) {
            return btoa(unescape(encodeURIComponent(str))); // 確保編碼正確處理非 ASCII 字符
        },
        showLink: function () {
            $("[name=BALink]").text($("[name=BANo] option:selected").text());
            href = 'http://192.168.1.151:8080/Sony/FM7_Applicant.aspx';
            queryStringInfo = $BC.queryStringInfo();
            queryString = $BC.buildLocationSearch(queryStringInfo);;

            $("[name=BALink]").attr('href', queryString);
        },
        setDetailDateRange: function (tr, start, end) {
            var tripTermStart = $("[area=revise] [name=TripTermStart]").val();
            var tripTermEnd = $("[area=revise] [name=TripTermEnd]").val();
            tr.find("[name=" + start + "]").datepicker("setStartDate", tripTermStart);
            tr.find("[name=" + start + "]").datepicker("setEndDate", tripTermEnd);
            tr.find("[name=" + end + "]").datepicker("setEndDate", tripTermStart);
            tr.find("[name=" + end + "]").datepicker("setEndDate", tripTermEnd);
        },
        isEmptyDateRange: function (firstName, secondName) {
            var firstField = !firstName ? "" : firstName.val();
            var secondField = !secondName ? "" : secondName.val();
            return !firstField || !secondField;
        },
        overApplicantDate: function (base, count) {
            var baseDate = ">=" + base;
            var dateline = Common.GetTableData("Sony_Config_CustomHoliday", {
                "Date": baseDate,
                "IsHoliday": "0"
            }, {
                fields: ["Date", "IsHoliday"]
            })[10].Date;
            // 回傳「申請時間」，如為此值就是超過10個工作天 -
            return new Date(new Date(dateline).setDate(new Date(dateline).getDate() + 1)).toISOString().split("T")[0];
        },
        isExpired: function (targetDate) {
            // 當天 > targetDate
            return new Date().toISOString().split("T")[0] > targetDate;
        },
        getS068: function () {
            var obj = {};
            var USD = Number(Common.GetTableData("Sony_S068", { KURST: "M", "FCURR": "USD" }, { fields: ["UKURS"] })[0].UKURS);
            obj["USD"] = USD;
            obj["TWD"] = "1.00000";
            return obj;
        },
        locationRate: function (currency) { // 切換幣別 -
            if (currency == "TWD") {
                $("[currency]").find("[name=Currency]").val("TWD");
                $("[currency]").hide();
                $("[currency-rate]").last().next().attr("colspan", 5);
                $("[currency-rate]").hide();
            } else if (currency == "USD") {
                $("[currency]").find("[name=Currency]").val("USD").prop("disabled", true);
                $("[currency]").show();
                $("[currency-rate]").last().next().attr("colspan", 1);
                $("[currency-rate]").show();
            }
        },
        getPrevDatas: function (identify, requisitionID) {
            if (identify == "BA") {
                // M
                var list = Common.GetTableData("FM7T_BA_M", { $X: "request", "RequisitionID": requisitionID }, null)[0];
                list["TripTermStart"] = list["TripTermStart"].substring(0, 10);
                list["TripTermEnd"] = list["TripTermEnd"].substring(0, 10);

                if (list["ApplicantDateTime"] > list["TripTermStart"]) {
                    $("[delay1]").show();
                    $("[delay]").show();
                    addNecessaryDot("Reason");

                } else {
                    $("[delay1]").hide();
                    $("[delay1]").hide();
                    removeNecessaryDot("Reason");
                }

                for (let i in list) {
                    if (i != "RequisitionID" && i != "ApplicationType") {
                        $("[name=" + i + "]").val(list[i]);
                    }
                }
                // D
                $detail.detailOrigin.clear();
                $detail.detailOrigin2.clear();
                $detail.D1.clear();
                $detail.detail2.clear();
                var listD = Common.GetTableData("FM7T_BA_D2", { $X: "request", "RequisitionID": requisitionID }, null);
                for (var j = 0; j < listD.length; j++) {
                    $detail.detailOrigin2.trigger.add();
                    $detail.detail2.trigger.add();
                    $BC.setCountryOptions($('[name=DetailItemOrigin2]').eq(j));
                    $BC.setCountryOptions($('[name=DetailItem2]').eq(j));
                    var listDarray = listD[j];
                    listDarray["FromDate"] = listDarray["FromDate"].substring(0, 10);
                    listDarray["EndDate"] = listDarray["EndDate"].substring(0, 10);
                    var trO = $detail.detailOrigin2.target.find("tbody tr:nth-child(" + (j + 1) + ")");
                    var tr = $detail.detail2.target.find("tbody tr:nth-child(" + (j + 1) + ")");
                    for (let i in listDarray) {
                        trO.find("[name=" + i + "]").val(listDarray[i]);
                        tr.find("[name=" + i + "]").val(listDarray[i]);
                    }
                }
                // D1 - 
                var listD1 = Common.GetTableData("FM7T_BA_D", { $X: "request", "RequisitionID": requisitionID }, null);
                for (var j = 0; j < listD1.length; j++) {
                    $detail.detailOrigin.trigger.add();
                    $detail.D1.trigger.add();
                    var listDarray = listD1[j];
                    listDarray["FromDt"] = listDarray["FromDt"].substring(0, 10);
                    listDarray["ToDt"] = listDarray["ToDt"].substring(0, 10);
                    var trO = $detail.detailOrigin.target.find("tbody tr:nth-child(" + (j + 1) + ")");
                    var tr = $detail.D1.target.find("tbody tr:nth-child(" + (j + 1) + ")");
                    for (let i in listDarray) {
                        trO.find("[name=" + i + "]").val(listDarray[i]);
                        tr.find("[name=" + i + "]").val(listDarray[i]);
                    }
                }
            } else if (identify == "BC") {
                // M
                var list = Common.GetTableData("FM7T_BC_M", { $X: "request", "RequisitionID": requisitionID }, null)[0];
                list["TripTermStart"] = list["TripTermStart"].substring(0, 10);
                list["TripTermEnd"] = list["TripTermEnd"].substring(0, 10);

                if (list["ApplicantDateTime"] > list["TripTermStart"]) {
                    $("[delay1]").show();
                    $("[delay]").show();
                    addNecessaryDot("Reason");

                } else {
                    $("[delay1]").hide();
                    $("[delay1]").hide();
                    removeNecessaryDot("Reason");
                }

                for (let i in list) {
                    if (i != "RequisitionID" && i != "ApplicationType") {
                        $("[name=" + i + "]").val(list[i]);
                    }
                }
                // D -
                $detail.detailOrigin.clear();
                $detail.detailOrigin2.clear();
                $detail.D1.clear();
                $detail.detail2.clear();
                var listD = Common.GetTableData("FM7T_BC_D", { $X: "request", "RequisitionID": requisitionID }, null);
                for (var j = 0; j < listD.length; j++) {
                    $detail.detailOrigin2.trigger.add();
                    $detail.detail2.trigger.add();
                    $BC.setCountryOptions($('[name=DetailItemOrigin2]').eq(j));
                    $BC.setCountryOptions($('[name=DetailItem2]').eq(j));

                    var listDarray = listD[j];
                    listDarray["FromDate"] = listDarray["FromDate"].substring(0, 10);
                    listDarray["EndDate"] = listDarray["EndDate"].substring(0, 10);
                    var trO = $detail.detailOrigin2.target.find("tbody tr:nth-child(" + (j + 1) + ")");
                    var tr = $detail.detail2.target.find("tbody tr:nth-child(" + (j + 1) + ")");
                    for (let i in listDarray) {
                        trO.find("[name=" + i + "]").val(listDarray[i]);
                        tr.find("[name=" + i + "]").val(listDarray[i]);
                    }
                }
                // D1 - 
                var listD1 = Common.GetTableData("FM7T_BC_D1", { $X: "request", "RequisitionID": requisitionID }, null);
                for (var j = 0; j < listD1.length; j++) {
                    $detail.detailOrigin.trigger.add();
                    $detail.D1.trigger.add();
                    var listDarray = listD1[j];
                    listDarray["FromDt"] = listDarray["FromDt"].substring(0, 10);
                    listDarray["ToDt"] = listDarray["ToDt"].substring(0, 10);
                    var trO = $detail.detailOrigin.target.find("tbody tr:nth-child(" + (j + 1) + ")");
                    var tr = $detail.D1.target.find("tbody tr:nth-child(" + (j + 1) + ")");
                    for (let i in listDarray) {
                        trO.find("[name=" + i + "]").val(listDarray[i]);
                        tr.find("[name=" + i + "]").val(listDarray[i]);
                    }
                }
            }
        },
        setOrginData: function (target = "") {
            var bcNoReq = $("[name=BANo]").val();
            //var bcNoReq = $("[name=BANo] option:selected").attr("req");
            var bcNoIdentify = $("[name=BANo]").find("option[value='" + bcNoReq + "']").prop("data")["Identify"];
            //var bcNoIdentify = $("[name=BANo]").find("option[req='" + bcNoReq + "']").prop("data")["Identify"];
            $("[name=PrevIdentify]").val(bcNoIdentify);
            $BC.getPrevDatas(bcNoIdentify, bcNoReq);
        },
        noDetails: function () {
            return !$detail.D1.rows && !$detail.detail2.rows;
        },
        getTitleID: function (accountId, deptId) {
            return Common.GetTableData("FSe7en_Org_MemberStruct", {
                $X: "request",
                "AccountID": accountId,
                "DeptID": deptId
            }, {
                fields: ["TitleID"]
            })[0].TitleID;
        },
        getOverseasAllowance: function () {
            var list = [];
            list = Common.GetTableData("Sony_Config_AllowanceAndTransportation", null, { fields: ["Country", "CountryId", "Transportation", "DailyAllowanceUSD"] });
            return list;
        },
        getOverseasAllowanceByTitle: function (titleId = "") {
            var list = [];
            list = Common.GetTableData("Sony_Config_Allowance", {
                "Enabled": 1,
                "TitleID": titleId
            }, {
                fields: [
                    "InternationalAccommodation", "AirJPN", "AirHK", "AirSIN", "AirCN", "AirUSA", "AirOther"
                ]
            });
            return list;
        },
        getLocalAllowance: function (titleId = "") {
            var list = [];
            list = Common.GetTableData("Sony_Config_Allowance", {
                "Enabled": 1,
                "TitleID": titleId
            }, {
                fields: ["DomesticDayAllowance", "DomesticOvernightAllowance", "DomesticAccommodation", "DomesticTransportation"]
            });
            return list;
        },
        setCountryOptions: function (tr) {
            var opList = $BC.getOverseasAllowance();
            opList.forEach(function (o) {
                var existingOption = tr.find(`[name=Country] option[value="${o.CountryId}"]`);
                if (existingOption.length === 0) { // 如果不存在相同值的 option
                    var op = $(`<option value=""></option>`).clone();
                    op.text(o.Country).val(o.CountryId).prop("data", o);
                    tr.find("[name=Country]").append(op);
                }
            });
        },
        setLocalOptions: function (tr, accountId, deptId) {
            var op = $(`<option value=""></option>`).clone();
            var data = $BC.getLocalAllowance($BC.getTitleID(accountId, deptId));
            op.val("Local").text("Local").prop("data", data);
            tr.find("[name=Country]").append(op).prop("disabled", true);
        },
        getCostCenter: function (dept) {
            return Common.GetTableData("Sony_CostCenter_Mapping", {
                DeptID: dept,
            });
        },
        // Cost Center
        bindCostCenterOption: function (deptID) {
            $("[name=CostCenter]").empty();
            var option = $(`<option value=""></option>`).clone();
            $("[name=CostCenter]").append(option);
            $BC.getCostCenter(deptID).forEach((obj) => {
                var op = option.clone();
                op.val(obj.CostCenter).text(obj.CostCenter);
                $("[name=CostCenter]").append(op);
            });
        },
        getApplicantDatas: function () { // 帶回修改後的資料
            var requisitionID = $('[name=RequisitionID]').val();
            // M
            var list = Common.GetTableData("FM7T_BC_M", { $X: "request", "RequisitionID": requisitionID }, null)[0];
            list["TripTermStart"] = list["TripTermStart"].substring(0, 10);
            list["TripTermEnd"] = list["TripTermEnd"].substring(0, 10);
            for (let i in list) {
                if (i != "RequisitionID") {
                    $("[area=revise] [name=" + i + "]").val(list[i]);
                }
            }
        },
        setD2CountryDaily: function (tr) {
            var countryId = tr.find("[name=Country]").val();
            var obj = tr.find("[name=Country] option[value=" + countryId + "]").prop("data");
            // 
            if (!$BC.isEmptyDateRange(tr.find("[name=FromDate]"), tr.find("[name=EndDate]"))) {
                var night = Common.dateCount(tr.find("[name=EndDate]").val(), tr.find("[name=FromDate]").val());
                var trAmount = 0;
                tr.find("[name=DailyAllowance]").val(obj.DailyAllowanceUSD);
                trAmount = Number(obj.DailyAllowanceUSD) * (night + 1);
                tr.find("[name=Amount]").val(Common.Thousandth(trAmount));
            }
        },
        setD2LocalDaily: function (tr) {
            var local = tr.find("[name=Country]").val();
            var obj = tr.find("[name=Country] option[value=" + local + "]").prop("data");
            // 以每列過夜與否計算


            if (!$BC.isEmptyDateRange(tr.find("[name=FromDate]"), tr.find("[name=EndDate]"))) {
                var night = Common.dateCount(tr.find("[name=EndDate]").val(), tr.find("[name=FromDate]").val());
                var trAmount = 0;
                if (night > 0) {
                    tr.find("[name=DailyAllowance]").val(obj.DomesticOvernightAllowance);
                    trAmount = Number(obj.DomesticOvernightAllowance) * (night + 1);

                } else {
                    tr.find("[name=DailyAllowance]").val(obj.DomesticDayAllowance);
                    trAmount = Number(obj.DomesticDayAllowance) * (night + 1);
                }
                tr.find("[name=Amount]").val(Common.Thousandth(trAmount));
            }

        },
        countD2TotalAmount: function () {
            var total = 0;
            $detail.detail2.target.find("tbody tr").each(function (i, tr) {
                var $tr = $(tr);
                if ($("[name=Location]").val() == "Local") {
                    $BC.setD2LocalDaily($tr);
                } else if ($("[name=Location]").val() == "Overseas") {
                    $BC.setD2CountryDaily($tr);
                }

                if ($tr.find("[name=Amount]").val() != "") {
                    var amt = Common.RemoveThousandth($tr.find("[name=Amount]").val());
                    total += Number(amt);
                }
            });
            total = Math.round(Number($("[name=ExchangeRate]").val()) * total);
            $("[name=TotalDailyAllowance]").val(Common.Thousandth(total));
            $BC.countTotal();
        },
        countTotal: function () {
            var totalDailyAllowance = $("[name=TotalDailyAllowance]").val();
            var accommodation = $("[name=Accommodation]").val();
            var transportation = $("[name=Transportation]").val();
            var gift = $("[name=Gift]").val();
            var enterainment = $("[name=Enterainment]").val();
            var bizMeal = $("[name=BizMeal]").val();
            totalDailyAllowance = Number(Common.RemoveThousandth(totalDailyAllowance));
            accommodation = Number(Common.RemoveThousandth(accommodation));
            transportation = Number(Common.RemoveThousandth(transportation));
            gift = Number(Common.RemoveThousandth(gift));
            enterainment = Number(Common.RemoveThousandth(enterainment));
            bizMeal = Number(Common.RemoveThousandth(bizMeal));

            var total = 0;
            total = totalDailyAllowance + accommodation + transportation + gift + bizMeal;
            $("[name=TotalAmount").val(Common.Thousandth(total));
        },
        checkD2EndCountry: function () {
            var endDate = "";
            var dataObj = null;
            var transportation = 0;
            $detail.detail2.target.find("tbody tr").each(function (i, tr) {
                var $tr = $(tr);
                if ($tr.find("[name=EndDate]").val() > endDate) {
                    endDate = $tr.find("[name=EndDate]").val();
                    var countryId = $tr.find("[name=Country]").val();
                    dataObj = $tr.find("[name=Country]").find("option[value=" + countryId + "]").prop("data");
                    console.log("dataObj_1", dataObj);
                }
                if ($tr.find("[name=EndDate]").val() == endDate) {
                    endDate = $tr.find("[name=EndDate]").val();
                    var countryId = $tr.find("[name=Country]").val();
                    dataObj = $tr.find("[name=Country]").find("option[value=" + countryId + "]").prop("data");
                    console.log("dataObj_3", dataObj);
                }
                if (!endDate) {
                    var countryId = $tr.find("[name=Country]").val();
                    dataObj = $tr.find("[name=Country]").find("option[value=" + countryId + "]").prop("data");
                    console.log("dataObj_2", dataObj);
                }

            });
            var titleId = $BC.getTitleID($("[name=tApplicantID]").val(), $("[name=tApplicantDept]").val());
            var data = $BC.getOverseasAllowanceByTitle(titleId)[0];
            if (dataObj != null) {
                transportation = data[dataObj.Transportation];
            }
            $("[name=Transportation]").val(Common.Thousandth(transportation));
        }


    };

    $().ready(function () {
        //BANo下拉選單
        let bcNoInfo = $BC.getPrevSerialID($("[name=tApplicantID]").val());
        $BC.appendBcSelector(bcNoInfo);
        $BC.bindCostCenterOption(bpm.formInfo.applicantDept);

        $("[name=BANo]").change(function () {

            if ($("[name=BANo]").val() != "") {
                var v = $("[name=BANo]").val();
                $BC.showLink();
                $BC.setOrginData();
                $("[name=BANo]").val(v);
                //$("[name=Remark]").val("");
            }

            var s068 = $BC.getS068();
            var val = $("[name=Location]").val();
            if (val == "Overseas") {
                $BC.locationRate("USD");
                $detail.detail2.target.find("[name=ExchangeRate]").val(s068["USD"]);

                $detail.detail2.target.find("tbody tr").each(function (i, tr) {
                    var $tr = $(tr);
                    //$tr.find("[name=Country]").empty();
                    $BC.setCountryOptions($tr);
                });
            } else if (val == "Local") {
                $BC.locationRate("TWD");
                $detail.detail2.target.find("[name=ExchangeRate]").val(s068["TWD"]);
                $detail.detail2.target.find("tbody tr").each(function (i, tr) {
                    var $tr = $(tr);
                    $tr.find("[name=Country]").empty();
                    $BC.setLocalOptions($tr);
                });
                $detail.detailOrigin2.target.find("tbody tr").each(function (i, tr) {
                    var $tr = $(tr);
                    $tr.find("[name=Country]").empty();
                    $BC.setLocalOptions($tr);
                    $('[area=origin] tfoot td').eq(0).text('');
                });
            }

            //初始帶入千分位


            $("[name=Accommodation]").val(Common.Thousandth($("[name=Accommodation]").val()));
            $("[name=Transportation]").val(Common.Thousandth($("[name=Transportation]").val()));
            $("[name=Gift]").val(Common.Thousandth($("[name=Gift]").val()));
            $("[name=Enterainment]").val(Common.Thousandth($("[name=Enterainment]").val()));
            $("[name=BizMeal]").val(Common.Thousandth($("[name=BizMeal]").val()));
            //$("[name=DailyAllowance]").val(Common.Thousandth($("[name=DailyAllowance]").val()));
            // $detail.detail2.target.find("tbody tr").each(function (i, tr) {
            //     var $tr = $(tr);
            //     var t = $tr.find("[name=DailyAllowance]").val;
            //     $tr.find("[name=DailyAllowance]").val(t)
            // });

            // //$("[name=Amount]").val(Common.Thousandth($("[name=Amount]").val()));
            // $detail.detail2.target.find("tbody tr").each(function (i, tr) {
            //     var $tr = $(tr);
            //     var t = $tr.find("[name=Amount]").val;
            //     $tr.find("[name=Amount]").val(t)
            // });

            $("[area=revise] [name=Transportation]").input(function () {
                if ($("[area=revise] [name=Transportation]").val() != "") {
                    $("[area=revise] [name=Transportation]").val(Common.Thousandth($("[area=revise] [name=Transportation]").val()));
                }
            })
            $("[area=revise] [name=Gift]").input(function () {
                if ($("[area=revise] [name=Gift]").val() != "") {
                    $("[area=revise] [name=Gift]").val(Common.Thousandth($("[area=revise] [name=Gift]").val()));
                }
            })
            $("[area=revise] [name=Enterainment]").input(function () {
                if ($("[area=revise] [name=Enterainment]").val() != "") {
                    $("[area=revise] [name=Enterainment]").val(Common.Thousandth($("[area=revise] [name=Enterainment]").val()));
                }
            })
            $("[area=revise] [name=BizMeal]").input(function () {
                if ($("[area=revise] [name=BizMeal]").val() != "") {
                    $("[area=revise] [name=BizMeal]").val(Common.Thousandth($("[area=revise] [name=BizMeal]").val()));
                }
            })
            // $detail.D1.addAfter((tr, i) => {
            //     Common.dateRange(tr.find("[name=FromDt]"), tr.find("[name=ToDt]"));
            //     $BC.setDetailDateRange(tr, "FromDt", "ToDt"); // 可選日期僅限 Trip Term 區間 -

            //     $("[name=TripTermStart],[name=TripTermEnd]").prop("disabled", true).removeClass("input-only-click");
            // });

        });

        //選cancel時隱藏revise area
        $("[name=ApplicationType]").change(function () {
            var checked = $(this).val();
            TransType(checked);
        });

        $('#tripTerm').datepicker({
            inputs: $('[area=revise] [name=TripTermStart],[area=revise] [name=TripTermEnd]')
        });

        //計算Trip Period
        $("[area=revise] [name=TripTermStart]").change(function () {
            var diffDay = getDateDiff($("[area=revise] [name=TripTermStart]").val(), $("[area=revise] [name=TripTermEnd]").val());
            $("[area=revise] [name=TripPeriodStart]").val(diffDay);
            $("[area=revise] [name=TripPeriodEnd]").val(diffDay - 1);
        })
        $("[area=revise] [name=TripTermEnd]").change(function () {
            var diffDay = getDateDiff($("[area=revise] [name=TripTermStart]").val(), $("[area=revise] [name=TripTermEnd]").val());
            $("[area=revise] [name=TripPeriodStart]").val(diffDay);
            $("[area=revise] [name=TripPeriodEnd]").val(diffDay - 1);
        })

        $("[area=revise] [name=TripTermStart],[area=revise] [name=TripTermEnd]").change(function () {
            var startField = $("[area=revise] [name=TripTermStart]");
            var endField = $("[area=revise] [name=TripTermEnd]");
            if (!$BC.isEmptyDateRange(startField, endField)) {
                disabledButton("D1", false);
                disabledButton("detail2", false);
                var diffDay = Common.dateCount(endField.val(), startField.val());
                $("[area=revise] [name=TripPeriodStart]").val(diffDay + 1);
                $("[area=revise] [name=TripPeriodEnd]").val(diffDay);
            }
            // 申請日 > 出差起始日 -
            if ($BC.isExpired(startField.val())) {
                $("[delay]").show();
                addNecessaryDot("Reason");
            } else {
                $("[delay]").hide();
                removeNecessaryDot("Reason");
            }
        });

        //calTda();
        //計算Total Amount
        $('[name="TotalDailyAllowance"], [name="Accommodation"], [name="Transportation"], [name="Gift"], [name="Enterainment"], [name="BizMeal"]').on('input', calTotalAmount);
        calTotalAmount();


        // 25.01.15  -
        $detail.detail2.addAfter((tr, i) => {
            Common.dateRange(tr.find("[name=FromDate]"), tr.find("[name=EndDate]"));
            $BC.setDetailDateRange(tr, "FromDate", "EndDate"); // 可選日期僅限 Trip Term 區間 -

            //$("[name=TripTermStart],[name=TripTermEnd]").prop("disabled", true).removeClass("input-only-click");

            var prevTr = tr.prev()[0];
            if (i > 1) {
                // 前一列的結束日 -
                var prevEndDate = $(prevTr).find("[name=EndDate]").val();
                if (prevEndDate) {
                    // 前一列的結束日+1 -
                    var prevEndDatePlus = new Date(new Date(prevEndDate).setDate(new Date(prevEndDate).getDate() + 1)).toISOString().split("T")[0];
                    if (prevEndDatePlus <= $("[name=TripTermEnd]").val()) {
                        tr.find("[name=FromDate]").datepicker("setStartDate", prevEndDatePlus).val(prevEndDatePlus);
                        tr.find("[name=EndDate]").datepicker("setStartDate", prevEndDatePlus);
                    }
                    // 第一列不能更改 -
                    $detail.detail2.target.find("tbody tr:first").find("[name=FromDate]").prop("disabled", true);
                }
            } else {
                var tripTermStart = $("[name=TripTermStart]").val();
                tr.find("[name=FromDate]").datepicker("setStartDate", tripTermStart).val(tripTermStart).prop("disabled", true);
                tr.find("[name=EndDate]").datepicker("setStartDate", tripTermStart);
            }

            var s068 = $BC.getS068();
            if ($("[name=Location]").val() == "Local") {
                let countryOption = $(`<option value="Local">Local</option>`).clone();
                tr.find("[name=Country]").append(countryOption)
                tr.find("[name=Country]").prop("disabled", true);
            } else {
                tr.find("[name=Country]").prop("disabled", false);
            }

            var applicantTitleId = $BC.getTitleID($("[name=tApplicantID]").val(), $("[name=tApplicantDept]").val());
            tr.find("[name=FromDate],[name=EndDate]").change(function () {
                $BC.countD2TotalAmount();
                if ($("[name=Location]").val() == "Overseas") {
                    $BC.checkD2EndCountry()
                }
            });
            tr.find("[name=Country]").change(function () {
                $BC.countD2TotalAmount();
                if ($("[name=Location]").val() == "Overseas") {
                    $BC.checkD2EndCountry()
                }
            });

            // 國內、外出差 -
            if ($("[name=Location]").val() == "Overseas") {
                $BC.locationRate("USD");
                $detail.detail2.target.find("[name=ExchangeRate]").val(s068["USD"]);
                $BC.setCountryOptions(tr);
            } else if ($("[name=Location]").val() == "Local") {
                $BC.locationRate("TWD");
                $detail.detail2.target.find("[name=ExchangeRate]").val(s068["TWD"]);
                $BC.setLocalOptions(tr, $("[name=tApplicantID]").val(), $("[name=tApplicantDept]").val());
            }

            tr.find("[name=DailyAllowance]").input(function () {
                if ($(this).val() != "") {
                    $(this).val(Common.Thousandth($(this).val()));
                }
            });

            tr.find("[name=DailyAllowance]").input(function () {
                TotalAmount = 0;
                TParent = $(this).parent().parent();
                DA = $(this).val().RemoveThousandth();
                fromDt = TParent.find('[name=FromDate]').val();
                endDt = TParent.find('[name=EndDate]').val();
                var d = getDateDiff(fromDt, endDt);
                var sum = DA * d;
                TParent.find('[name=Amount]').val(Common.Thousandth(sum));
                calTda();
            });

            tr.find("[name=FromDate]").change(function () {
                TotalAmount = 0;
                TParent = $(this).parent().parent();
                DA = TParent.find('[name=DailyAllowance]').val().RemoveThousandth();
                fromDt = $(this).val();
                endDt = TParent.find('[name=EndDate]').val();
                var d = getDateDiff(fromDt, endDt);
                var sum = DA * d;
                TParent.find('[name=Amount]').val(Common.Thousandth(sum));
                calTda();
            });

            tr.find("[name=EndDate]").change(function () {
                TotalAmount = 0;
                TParent = $(this).parent().parent();
                DA = TParent.find('[name=DailyAllowance]').val().RemoveThousandth();
                fromDt = TParent.find('[name=FromDate]').val();
                endDt = $(this).val();
                var d = getDateDiff(fromDt, endDt);
                var sum = DA * d;
                TParent.find('[name=Amount]').val(Common.Thousandth(sum));
                calTda();
            });
        });

        $("#detail2 tbody").on("input", "[name=Amount]", function () {
            if ($(this).val() != "") {
                $(this).val(Common.Thousandth($(this).val()));
            }
        });

        $detail.detail2.delAfter(function () {
            detailsEmpty = $BA.noDetails();
            if (detailsEmpty) {
                $("[name=TripTermStart],[name=TripTermEnd]").prop("disabled", false).addClass("input-only-click");
            }
            if ($detail.detail2.rows > 0) {
                var tr = $detail.detail2.target.find("tbody tr:first");
                var tripTermStart = $("[name=TripTermStart]").val();
                tr.find("[disabled]").prop("disabled", false).addClass("input-only-click");
                tr.find("[area=revise] [name=FromDate]").datepicker("setStartDate", tripTermStart).datepicker("update", tripTermStart).val(tripTermStart).prop("disabled", true);
                tr.find("[area=revise] [name=EndDate]").datepicker("setStartDate", tripTermStart);
                if ($detail.detail2.rows > 1) {
                    var trLast = $detail.detail2.target.find("tbody tr:last");
                    trLast.find("[disabled]").prop("disabled", false).addClass("input-only-click");
                }
            }
            $BA.countD2TotalAmount();
        });
        //刪掉Daily Allowance時，重新算Total Daily Allowance
        // $('[area=revise]').find("[action=delRow]").eq(1).click(function () {
        //    var TotalAmount = 0;
        //    $("#detail2").find("[name=Amount]").each(function () {
        //       var amt = Common.RemoveThousandth($(this).val());
        //       if (!isNaN(amt) && amt != "") {
        //          TotalAmount += parseInt(amt);
        //       }
        //    })
        //    $("[area=revise] [name=TotalDailyAllowance]").val(Common.Thousandth(TotalAmount));
        //    calTotalAmount()
        // })
        // 25.01.15  -/

        // 25.01.15  -
        $detail.D1.addAfter((tr, i) => {
            Common.dateRange(tr.find("[name=FromDt]"), tr.find("[name=ToDt]"));
            $BC.setDetailDateRange(tr, "FromDt", "ToDt"); // 可選日期僅限 Trip Term 區間 -

            //$("[name=TripTermStart],[name=TripTermEnd]").prop("disabled", true).removeClass("input-only-click");

            var prevTr = tr.prev()[0];
            if (i > 1) {
                // 前一列的結束日 -
                var prevEndDate = $(prevTr).find("[name=EndDate]").val();
                if (prevEndDate) {
                    // 第一列不能更改 -
                    $detail.detail2.target.find("tbody tr:first").find("[name=FromDate]").prop("disabled", true);
                }
            } else {
                var tripTermStart = $("[name=TripTermStart]").val();
                tr.find("[name=FromDate]").datepicker("setStartDate", tripTermStart).val(tripTermStart).prop("disabled", true);
            }

            $("[name=TripTermStart],[name=TripTermEnd]").prop("disabled", true).removeClass("input-only-click");
            $BC.countD2TotalAmount();

        });

        $detail.D1.delAfter(function (tr) {
            detailsEmpty = $BC.noDetails();
            if (detailsEmpty) {
                $("[area=revise] [name=TripTermStart],[area=revise] [name=TripTermEnd]").prop("disabled", false).addClass("input-only-click");
            }

        });
        //計算Amount
        // $('#detail2').on("input", "[name=DailyAllowance]", function () {
        //    TotalAmount = 0;
        //    TParent = $(this).parent().parent();
        //    DA = $(this).val().RemoveThousandth();
        //    fromDt = TParent.find('[name=FromDate]').val();
        //    endDt = TParent.find('[name=EndDate]').val();
        //    var d = getDateDiff(fromDt, endDt);
        //    var sum = DA * d;
        //    TParent.find('[name=Amount]').val(Common.Thousandth(sum));
        //    calTda();
        // });
        // $('#detail2').on("change", "[name=FromDate]", function () {
        //    TotalAmount = 0;
        //    TParent = $(this).parent().parent();
        //    DA = TParent.find('[name=DailyAllowance]').val().RemoveThousandth();
        //    fromDt = $(this).val();
        //    endDt = TParent.find('[name=EndDate]').val();
        //    var d = getDateDiff(fromDt, endDt);
        //    var sum = DA * d;
        //    TParent.find('[name=Amount]').val(Common.Thousandth(sum));
        //    calTda();
        // });
        // $('#detail2').on("change", "[name=EndDate]", function () {
        //    TotalAmount = 0;
        //    TParent = $(this).parent().parent();
        //    DA = TParent.find('[name=DailyAllowance]').val().RemoveThousandth();
        //    fromDt = TParent.find('[name=FromDate]').val();
        //    endDt = $(this).val();
        //    var d = getDateDiff(fromDt, endDt);
        //    var sum = DA * d;
        //    TParent.find('[name=Amount]').val(Common.Thousandth(sum));
        //    calTda();
        // });
        // 25.01.15  -/

        //簽核時帶回資料 -
        if ($form.processID == "draft" || (bpm.formInfo.processID == "applicant" && $form.refillFlag.indexOf(Common.GetRequest("refill")) > -1) || bpm.formInfo.processID != "applicant") {

            $form.setDatas();
            $("[name=TripTermStart]").val($("[name=TripTermStart]").val().split("T")[0]);
            $("[name=TripTermEnd]").val($("[name=TripTermEnd]").val().split("T")[0]);
            ["TotalAmount", "TotalDailyAllowance", "Accommodation", "Transportation", "Gift", "Enterainment", "BizMeal"].forEach(name => {
                $("[name=" + name + "]").val(Common.Thousandth($("[name=" + name + "]").val()));
            });

            $detail.D1.clear();
            //明細表填值 -
            $detail.D1.setDatas({
                autoDetailID: true,
                addAfter: function (tr, data) {
                    var fromDt = tr.find("[name=FromDt]").val();
                    var toDt = tr.find("[name=ToDt]").val();
                    fromDt = fromDt.split("T")[0];
                    toDt = toDt.split("T")[0];
                    tr.find("[name=FromDt]").datepicker("update", fromDt).val(fromDt);
                    tr.find("[name=ToDt]").datepicker("update", toDt).val(toDt);
                },

            });
            $detail.detail2.clear();
            $detail.detail2.setDatas({
                addAfter: function (tr, data) {
                    var fromDt = tr.find("[name=FromDate]").val();
                    var toDt = tr.find("[name=EndDate]").val();
                    var dailyAllowance = tr.find("[name=DailyAllowance]").val();
                    var amount = tr.find("[name=Amount]").val();
                    fromDt = fromDt.split("T")[0];
                    toDt = toDt.split("T")[0];
                    dailyAllowance = Common.Thousandth(dailyAllowance);
                    amount = Common.Thousandth(amount);
                    tr.find("[name=FromDate]").datepicker("update", fromDt).val(fromDt);
                    tr.find("[name=EndDate]").datepicker("update", toDt).val(toDt);
                    tr.find("[name=DailyAllowance]").val(dailyAllowance);
                    tr.find("[name=Amount]").val(amount);
                }
            }
            );
            $BC.getApplicantDatas();
            $("[name=Location]").eq(1).val($("[name=Location]").eq(0).val());
            if ($('[name=ApplicationType]:checked').val() == 'Cancel') {
                $('[area=revise]').hide();
            }
        }
        // if (bpm.formInfo.processID != "applicant") {
        //    $detail.detail.view.approve();
        //    $detail.detail2.view.approve();
        // }

        bpm.handlerSend(function (info) {
            var sendFlag = true;
            var errorCount = 0;
            if ((info.action == "draft" && bpm.formInfo.processID == "applicant") || info.action == "submit" || bpm.formInfo.processID == Common.ResendProcess) {
                if (info.action == "submit") {
                    if (bpm.formInfo.processID == "applicant") {

                        $('[area="origin"] [name]').removeAttr('name');//只insert修改資訊
                        $("[name=TotalAmount]").val($("[name=TotalAmount]").val().RemoveThousandth());
                        $("[name=Accommodation]").val($("[name=Accommodation]").val().RemoveThousandth());
                        $("[name=Transportation]").val($("[name=Transportation]").val().RemoveThousandth());
                        $("[name=Gift]").val($("[name=Gift]").val().RemoveThousandth());
                        $("[name=Enterainment]").val($("[name=Enterainment]").val().RemoveThousandth());
                        $("[name=BizMeal]").val($("[name=BizMeal]").val().RemoveThousandth());
                        $("[name=TotalDailyAllowance]").val($("[name=TotalDailyAllowance]").val().RemoveThousandth());

                        $("#BC").find("[disabled]:not(button)").each(function (i, el) {
                            $(el).prop("disabled", false);
                        });
                        //送出之前檢查，若有填入金額，reason為必填

                        if ($("[area=revise] [name=Gift]").val() != "") {
                            if ($("[name=GiftReason]").val() == "") {
                                $('[area=revise] [name=GiftReason]').Validation('Receiver / Reason 不得為空值');
                                sendFlag = false;
                            }
                        }
                        if ($("[area=revise] [name=Enterainment]").val() != "") {
                            if ($("[name=EnterainmentReason]").val() == "") {
                                $('[area=revise] [name=EnterainmentReason]').Validation('Receiver / Reason 不得為空值');
                                sendFlag = false;
                            }
                        }
                        if ($("[area=revise] [name=BizMeal]").val() != "") {
                            if ($("[name=BizMealReason]").val() == "") {
                                $('[area=revise] [name=BizMealReason]').Validation('Receiver / Reason 不得為空值');
                                sendFlag = false;
                            }
                        }

                        //insert D表資料

                        Common.InsertBPMDetail({
                            requisitionID: bpm.formInfo.requisitionID,
                            table: "FM7T_BC_D1",
                            itemList: JSON.stringify($detail.D1.getViewDatas()),
                            done: function (data) {
                                switch (data) {
                                    case "success":
                                        break;
                                    default:
                                        WrongAlert("新增明細表時發生錯誤 ! 未新增任何資料");
                                        sendFlag = false;
                                        break;
                                }
                            }
                        });
                        // $detail.detail2.submit({
                        //     setNull: true
                        // });
                        var detail2Data = $detail.detail2.getViewDatas();
                        for (var i = 0; i < detail2Data.length; i++) {
                            detail2Data[i].Amount = detail2Data[i].Amount.RemoveThousandth();
                            detail2Data[i].DailyAllowance = detail2Data[i].DailyAllowance.RemoveThousandth();
                        }

                        Common.InsertBPMDetail({
                            requisitionID: bpm.formInfo.requisitionID,
                            table: "FM7T_BC_D",
                            itemList: JSON.stringify(detail2Data),
                            done: function (data) {
                                switch (data) {
                                    case "success":
                                        break;
                                    default:
                                        WrongAlert("新增明細表時發生錯誤 ! 未新增任何資料");
                                        sendFlag = false;
                                        break;
                                }
                            }
                        });
                    }
                } else if (info.action == "draft") {
                    // 
                } else if (info.action == "agree") {

                    if (bpm.formInfo.processID == Common.ResendProcess) {
                        errorCount += !$form.validate() ? 1 : 0;
                        errorCount += !checkValid() ? 1 : 0;

                    }

                }
            }

            if (errorCount > 0) {
                sendFlag = false;
            }
            return sendFlag;
        });

    });
    //------------------------------------------D表按鈕卡控------------------------------------------//

    function TransType(checked) {
        if (checked == "Cancel") //In-house-
        {
            $("[area=revise]").hide();//選Cancel時，不顯示Revise area
            if ($("[name=BANo]").val() != "") {
                $("[name=BALink]").show();
                $BC.showLink();
            }
        }
        else {
            $("[area=revise]").show();
            $("[name=BALink]").hide();
        }
    }

    //---------------------------------------------------------
    function countrySelector() {
        //$("[name=Location]").change(function () {
        $("[name=Country]").empty();
        if ($("[name=Location]").val() == 'Local') {
            $("#detail2").find("[name=DetailItem2]").each(function () {

                let countryOption = $(`<option value="Local">Local</option>`);
                $(this).find("[name=Country]").append(countryOption)
                $(this).find("[name=Country]").prop('disabled', true);
            })
        }
        else {
            $("#detail2").find("[name=DetailItem2]").each(function () {

                $(this).find("[name=Country]").prop('disabled', false);
            })
        }
        //});
        $('[action=addRow]').eq(3).click(function () {
            $("#detail2").find("[name=DetailItem2]").each(function () {
                $(this).find("[name=Country]").empty();
                if ($("[name=Location]").val() == 'Local') {
                    let countryOption = $(`<option value="Local">Local</option>`);
                    $(this).find("[name=Country]").append(countryOption)
                    $(this).find("[name=Country]").prop('disabled', true);
                }
                else {
                    $(this).find("[name=Country]").prop('disabled', false);
                }
            });
        });
    }

    function getDateDiff(from, end) {
        var date1 = new Date(from);
        var date2 = new Date(end);
        return Math.round((date2 - date1) / 1000 / 60 / 60 / 24) + 1;
    }

    function delayReason() {
        if ($('[name=Location]').val() == "Local") {
            $('[area=delayReason]').show();
        }
        else {
            $('[area=delayReason]').hide();
        }
    }

    function calTda() {
        //計算Total Daily Allowance
        var Total = 0;
        // 25.01.15 -
        $detail.detail2.target.find("tbody tr").each(function (i, tr) {
            var $tr = $(tr);
            var exchangeRate = $('[area=revise] [name=ExchangeRate]').val();
            if ($tr.find('[name=Amount]').val() != "") {
                var amount = parseInt($tr.find('[name=Amount]').val().replace(/,/g, ''));
                Total += amount;
                $('#detail2 [name=TotalDailyAllowance]').val(Common.Thousandth(Math.round(Total * exchangeRate)));
            }
            calTotalAmount();
        });

        // $('#detail2 [name=DetailItem2]').each(function () {
        //    if ($(this).find('[name=Amount]').val() != "") {
        //       var amount = parseInt($(this).find('[name=Amount]').val().replace(/,/g, ''));
        //       Total += amount;
        //       $('#detail2 [name=TotalDailyAllowance]').val(Common.Thousandth(Total));
        //    }
        //    calTotalAmount()
        // })
        // 25.01.15 -/
    }

    function calTotalAmount() {
        //計算Total Amount
        let tda = Number(Common.RemoveThousandth($("[area=revise] [name=TotalDailyAllowance]").val())) || 0;
        let accCost = Number(Common.RemoveThousandth($("[area=revise] [name=Accommodation]").val())) || 0;
        let transCost = Number(Common.RemoveThousandth($("[area=revise] [name=Transportation]").val())) || 0;
        let giftCost = Number(Common.RemoveThousandth($("[area=revise] [name=Gift]").val())) || 0;
        let eCost = Number(Common.RemoveThousandth($("[area=revise] [name=Enterainment]").val())) || 0;
        let bmCost = Number(Common.RemoveThousandth($("[area=revise] [name=BizMeal]").val())) || 0;
        let total = tda + accCost + transCost + giftCost + eCost + bmCost;
        $("[area=revise] [name=TotalAmount]").val(Common.Thousandth(total));
    }
    function addNecessaryDot(v) {
        $("[name=" + v + "]").attr("necessary", "");
        if ($("[name=" + v + "]").closest(".form-group").find("label red").length < 1) {
            $("[name=" + v + "]").closest(".form-group").find("label").append(`<red type="show">*</red>`);
        }
    }
    function removeNecessaryDot(v) {
        $("[name=" + v + "]").removeAttr("necessary");
        if ($("[name=" + v + "]").closest(".form-group").find("label red").length > 0) {
            $("[name=" + v + "]").closest(".form-group").find("label red").remove();
        }
    }
    function disabledButton(detailName, isOpen) {
        $detail[detailName].target.closest(".table-responsive").find("[action=addRow],[action=delRow]").prop("disabled", isOpen);
    }
</script>