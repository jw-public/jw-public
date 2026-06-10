import * as React from "react";
import Select from "react-select";

export interface SelectOption {
  label: string;
  value: string;
}

// react-select based multi-select (replacement for autoform-select2).
export default function MultiSelect(props: {
  options: SelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  inputId?: string;
}): JSX.Element {
  return (
    <Select
      isMulti
      inputId={props.inputId}
      options={props.options}
      value={props.options.filter((o) => props.value.includes(o.value))}
      onChange={(selected: any) =>
        props.onChange((selected ?? []).map((o: SelectOption) => o.value))
      }
    />
  );
}
