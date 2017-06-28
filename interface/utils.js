const Utils = (function () {
    let flags;

    return {
        getFlags () {
            if (flags !== undefined) {
                return flags;
            }

            let matches = window.location.href.match(/&(.*?)=true/g);
            flags = matches? matches.map(val => val.match(/&(.*?)=true/)[1]) : [];
            return flags;
        }
    }
})();