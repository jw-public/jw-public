import * as React from "react";
import * as ReactDOM from "react-dom";
import Color from "../../../lib/Color";
import {Template} from "meteor/templating";

export const defaults: OptionalDataContext = {
    active         : true,
    striped        : false,
    wrapperClasses : ""
};


  export interface DataContext extends OptionalDataContext {
      value: number;
      minValue: number;
      maxValue: number;
      height: string;
      backgroundColor: Color;
      barColor: Color;
  }

  export interface OptionalDataContext {
      wrapperClasses?: string;
      active?: boolean;
      striped?: boolean;
  }

  function calculatePercentage(currentValue : number, minValue : number, maxValue : number) : number {
      let percentage: number = (currentValue - minValue) / (maxValue - minValue);
      return Math.round(percentage * 100);
  }


export class SmallProgressbar extends React.Component < DataContext, {} > {


    private getPercent(): number {
        // ---- WIDTH ---- //
        let percent: number = calculatePercentage(this.props.value, this.props.minValue, this.props.maxValue);

        // Werte über 100% und unter 0% werden abgeschnitten.
        percent = Math.min(100, percent);
        percent = Math.max(0, percent);

        return percent;
    }

    /** Wenn active gesetzt ist, wird der Fortschritts-Balken animiert. */
    private activeClass(): string {
        if (this.props.active) {
            return "active";
        } else {
            return "";
        }
    }

    /** Wenn striped gesetzt ist, wird der Fortschritts-Balken gestreift. */
    private stripedClass(): string {
        if (this.props.striped) {
            return "progress-bar-striped";
        } else {
            return "";
        }
    }



    /** CSS Styles für den Balken */
    cssBarStyles(): React.CSSProperties {
        let data: DataContext = this.props;

        // ---- HEIGHT ---- //
        let height: string;
        height = data.height;

        let width: string = `${this.getPercent()}%`;

        // Den Tooltip resetten, da sich der Inhalt geändert hat.
        $(`[data-toggle="tooltip"]`).tooltip();

        let background = data.barColor;

        return {
            "background-color": background.toString(),
            height,
            width
        };
    }

    cssWrapperStyles(): React.CSSProperties {
      let data: DataContext = this.props;

      // ---- HEIGHT ---- //
      let height: string;
      height = data.height;

      let background = data.backgroundColor;

        return {
            "background-color": background.toString(),
            height
        };
    }

    public render(): JSX.Element {


        let wrapperClassName = `progress-small ${this.props.wrapperClasses}`;
        let progressbarClassName = `progress-bar smooth-transition ${this.stripedClass()} ${this.activeClass()}`;
        let percentage = 0;

        let title = `Zu ${this.getPercent()}% belegt.`;

        return (
            <div
                className={wrapperClassName}
                title={title}
                data-original-title={title}
                style={this.cssWrapperStyles()}>
                <div
                    className={progressbarClassName}
                    role="progressbar"
                    aria-valuenow={this.props.value}
                    aria-valuemin={this.props.minValue}
                    aria-valuemax={this.props.maxValue}
                    style={this.cssBarStyles()}>
                    <span className="sr-only">{title}</span>
                </div>
            </div>
        );
    }
}
