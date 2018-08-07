
    export function getNames(e: any): Array<string> {
        let a: Array<string> = [];
        let val: any;
        for (val in e) {
            if (isNaN(val)) {
                a.push(val);
            }
        }
        return a;
    }

    export function getValues(e: any): Array<number> {
        let a: Array<number> = [];
        let val: any;
        for (val in e) {
            if (!isNaN(val)) {
                a.push(parseInt(val, 10));
            }
        }
        return a;
    }
