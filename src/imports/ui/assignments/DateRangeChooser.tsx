import * as React from "react";
import * as ReactDOM from "react-dom";
import * as moment from "moment";

import * as DateRangePicker from 'react-bootstrap-daterangepicker';
import Icon from "../../../client/react/lib/Icon";

import { ReactiveVar } from "meteor/reactive-var";

interface DateRangeChooserProps {
    startDate: ReactiveVar<Date>;
    endDate: ReactiveVar<Date>;
}

export class DateRangeChooser extends React.Component<DateRangeChooserProps, {}> {

    public render(): JSX.Element {
        let startDate = moment(this.props.startDate.get());
        let endDate = moment(this.props.endDate.get());

        return (
            <DateRangePicker startDate={startDate} endDate={endDate} ranges={this.ranges} locale={this.locale} onApply={this.handleEvent} >
                <button type="button" title="Termine filtern" className="btn btn-info selected-date-range-btn" style={{ width: '100%' }}>
                    <div className="pull-left">Filter</div>
                    <div className="pull-right">
                        <span>
                            {this.createButtonLabel(startDate, endDate)}
                        </span>
                        <span className="caret"></span>
                    </div>
                </button>
            </DateRangePicker>
        );
    }

    private createButtonLabel(startDate: moment.Moment, endDate: moment.Moment): String {
        let start = startDate.format(this.locale.format);
        let end = endDate.format(this.locale.format);
        let label = start + ' - ' + end;
        if (start === end) {
            label = start;
        }

        label = label + " ";
        return label;
    }

    private locale = {
        format: 'D[.]MM[.]YY',
        applyLabel: "Ok",
        cancelLabel: "Abbrechen",
        fromLabel: "Von",
        toLabel: "Bis",
        customRangeLabel: "Benutzerdefiniert",
        daysOfWeek: [
            "So",
            "Mo",
            "Di",
            "Mi",
            "Do",
            "Fr",
            "Sa"
        ],
        monthNames: [
            "Januar",
            "Februar",
            "März",
            "April",
            "Mai",
            "Juni",
            "Juli",
            "August",
            "September",
            "Oktober",
            "November",
            "Dezember"
        ],
        firstDay: 1
    };

    private ranges = {
        'Heute': [moment(), moment()],
        'Gestern': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Diese Woche': [moment().startOf('week').hour(0), moment().endOf('week').hour(23)],
        'Nächste Woche': [moment().add(7, "days").startOf('week').hour(0), moment().add(7, "days").endOf('week').hour(23)],
        'Nächste 4 Wochen': [moment().startOf('week').hour(0), moment().add(4, "weeks").endOf('week').hour(23)],
    };

    handleEvent = (event, picker) => {
        this.props.startDate.set(picker.startDate.toDate());
        this.props.endDate.set(picker.endDate.toDate());
    }
}
