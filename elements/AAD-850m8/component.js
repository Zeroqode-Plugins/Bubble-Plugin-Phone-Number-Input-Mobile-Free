function (props) {

    const { useState, useEffect, useMemo, useRef } = props.context.libraries["react"];
    const {
        View,
        Text,
        TextInput,
        TouchableOpacity,
        Modal,
        ScrollView,
        Platform
    } = props.context.libraries["react-native"];
    const { SafeAreaView } = props.context.libraries["react-native-safe-area-context"];

    const { publishState, triggerEvent } = props.instance;

    // --- PROPS ---
    const {
        placeholder_color,
        textColor,
        default_value,
        default_dialCode,
        inputPlaceholder = "Phone number",
        preferred_country_list,
        show_flag = true,
        show_dial_code = true,
        enable_formatting = true,
        dropdownArrowText = "▼",
        closeModalText = "✕",
        modalTopPadding = 0,
    } = props;


    // =========================================================================
    // HELPERS
    // =========================================================================

    const parsePreferredList = (text) =>
        text ? text.split(/[\n,]+/).map(t => t.trim().toUpperCase()) : [];

    const countHashes = (pattern) =>
        (pattern ? pattern.match(/#/g) || [] : []).length;

    const getMaxDigits = (raw, country) => {
        if (
            country.trunk &&
            country.national_pattern &&
            raw.startsWith(country.trunk)
        ) {
            return country.trunk.length + countHashes(country.national_pattern);
        }
        return countHashes(country.pattern);
    };

    const formatDigits = (raw, pattern) => {
        if (!pattern || !raw) return raw || "";

        const firstHash = pattern.indexOf("#");
        if (firstHash < 0) return raw;

        const leading = pattern.slice(0, firstHash);
        const rest    = pattern.slice(firstHash);

        let out = leading;
        let ri = 0;

        for (let i = 0; i < rest.length; i++) {
            if (ri >= raw.length) break;

            if (rest[i] === "#") {
                out += raw[ri++];
            } else {
                if (ri > 0 && ri < raw.length) {
                    out += rest[i];
                }
            }
        }

        return out;
    };

    const formatPhone = (raw, country) => {
        if (!raw) return "";

        if (
            country.trunk &&
            country.national_pattern &&
            raw.startsWith(country.trunk)
        ) {
            const rawAfterTrunk     = raw.slice(country.trunk.length);
            const patternAfterTrunk = country.national_pattern.slice(country.trunk.length);

            if (!rawAfterTrunk) return country.trunk;
            return country.trunk + formatDigits(rawAfterTrunk, patternAfterTrunk);
        }

        return formatDigits(raw, country.pattern);
    };

    const stripTrunk = (raw, country) => {
        if (country.trunk && raw.startsWith(country.trunk)) {
            return raw.slice(country.trunk.length);
        }
        return raw;
    };

    const getFormattedMaxLength = (currentFormatted, country) => {
        const intlFull   = '9'.repeat(countHashes(country.pattern));
        const intlFmtLen = formatPhone(intlFull, country).length;

        if (!country.trunk || !country.national_pattern) return intlFmtLen;

        const natlFull   = country.trunk + '9'.repeat(countHashes(country.national_pattern));
        const natlFmtLen = formatPhone(natlFull, country).length;

        const currentRaw = currentFormatted.replace(/\D/g, "");
        if (currentRaw.startsWith(country.trunk)) return natlFmtLen;
        return intlFmtLen;
    };

    const parseDefaultValue = (value, country) => {
        if (!value) return "";
        const clean = value.trim();
        if (clean.startsWith("+")) {
            const dialDigits = country.dialCode.replace("+", "");
            const withoutPlus = clean.replace("+", "");
            if (withoutPlus.startsWith(dialDigits)) {
                return withoutPlus.slice(dialDigits.length).replace(/\D/g, "");
            }
            return withoutPlus.replace(/\D/g, "");
        }
        return clean.replace(/\D/g, "");
    };


    // =========================================================================
    // COUNTRY LIST
    // =========================================================================

    const DEFAULT_COUNTRIES = [
        // A
        {"code":"AD","name":"Andorra","dialCode":"+376","flag":"🇦🇩","pattern":"### ###"},
        {"code":"AE","name":"United Arab Emirates","dialCode":"+971","flag":"🇦🇪","pattern":"# ### ####"},
        {"code":"AF","name":"Afghanistan","dialCode":"+93","flag":"🇦🇫","pattern":"## ###-####"},
        {"code":"AG","name":"Antigua and Barbuda","dialCode":"+1","flag":"🇦🇬","pattern":"(###) ###-####"},
        {"code":"AI","name":"Anguilla","dialCode":"+1","flag":"🇦🇮","pattern":"(###) ###-####"},
        {"code":"AL","name":"Albania","dialCode":"+355","flag":"🇦🇱","pattern":"## ###-####"},
        {"code":"AM","name":"Armenia","dialCode":"+374","flag":"🇦🇲","pattern":"## ###-###"},
        {"code":"AO","name":"Angola","dialCode":"+244","flag":"🇦🇴","pattern":"### ### ###"},
        {"code":"AQ","name":"Antarctica","dialCode":"+672","flag":"🇦🇶","pattern":"### ###"},
        {"code":"AR","name":"Argentina","dialCode":"+54","flag":"🇦🇷","pattern":"## ####-####"},
        {"code":"AS","name":"American Samoa","dialCode":"+1","flag":"🇦🇸","pattern":"(###) ###-####"},
        {"code":"AT","name":"Austria","dialCode":"+43","flag":"🇦🇹","pattern":"### #######","trunk":"0","national_pattern":"0### #######"},
        {"code":"AU","name":"Australia","dialCode":"+61","flag":"🇦🇺","pattern":"### ### ###","trunk":"0","national_pattern":"0### ### ###"},
        {"code":"AW","name":"Aruba","dialCode":"+297","flag":"🇦🇼","pattern":"### ####"},
        {"code":"AX","name":"Åland Islands","dialCode":"+358","flag":"🇦🇽","pattern":"## ###-####","trunk":"0","national_pattern":"0## ###-####"},
        {"code":"AZ","name":"Azerbaijan","dialCode":"+994","flag":"🇦🇿","pattern":"## ###-##-##"},

        // B
        {"code":"BA","name":"Bosnia and Herzegovina","dialCode":"+387","flag":"🇧🇦","pattern":"## ###-###"},
        {"code":"BB","name":"Barbados","dialCode":"+1","flag":"🇧🇧","pattern":"(###) ###-####"},
        {"code":"BD","name":"Bangladesh","dialCode":"+880","flag":"🇧🇩","pattern":"####-######","trunk":"0","national_pattern":"0####-######"},
        {"code":"BE","name":"Belgium","dialCode":"+32","flag":"🇧🇪","pattern":"### ## ## ##","trunk":"0","national_pattern":"0### ## ## ##"},
        {"code":"BF","name":"Burkina Faso","dialCode":"+226","flag":"🇧🇫","pattern":"## ## ## ##"},
        {"code":"BG","name":"Bulgaria","dialCode":"+359","flag":"🇧🇬","pattern":"### ### ###"},
        {"code":"BH","name":"Bahrain","dialCode":"+973","flag":"🇧🇭","pattern":"#### ####"},
        {"code":"BI","name":"Burundi","dialCode":"+257","flag":"🇧🇮","pattern":"## ## ## ##"},
        {"code":"BJ","name":"Benin","dialCode":"+229","flag":"🇧🇯","pattern":"## ## ## ##"},
        {"code":"BL","name":"Saint Barthélemy","dialCode":"+590","flag":"🇧🇱","pattern":"### ## ## ##"},
        {"code":"BM","name":"Bermuda","dialCode":"+1","flag":"🇧🇲","pattern":"(###) ###-####"},
        {"code":"BN","name":"Brunei","dialCode":"+673","flag":"🇧🇳","pattern":"### ####"},
        {"code":"BO","name":"Bolivia","dialCode":"+591","flag":"🇧🇴","pattern":"########"},
        {"code":"BQ","name":"Caribbean Netherlands","dialCode":"+599","flag":"🇧🇶","pattern":"### ####"},
        {"code":"BR","name":"Brazil","dialCode":"+55","flag":"🇧🇷","pattern":"## #####-####"},
        {"code":"BS","name":"Bahamas","dialCode":"+1","flag":"🇧🇸","pattern":"(###) ###-####"},
        {"code":"BT","name":"Bhutan","dialCode":"+975","flag":"🇧🇹","pattern":"## ### ###"},
        {"code":"BV","name":"Bouvet Island","dialCode":"+47","flag":"🇧🇻","pattern":"### ## ###"},
        {"code":"BW","name":"Botswana","dialCode":"+267","flag":"🇧🇼","pattern":"## ### ###"},
        {"code":"BY","name":"Belarus","dialCode":"+375","flag":"🇧🇾","pattern":"## ###-##-##"},
        {"code":"BZ","name":"Belize","dialCode":"+501","flag":"🇧🇿","pattern":"###-####"},

        // C
        {"code":"CA","name":"Canada","dialCode":"+1","flag":"🇨🇦","pattern":"(###) ###-####"},
        {"code":"CC","name":"Cocos Islands","dialCode":"+61","flag":"🇨🇨","pattern":"### ### ###"},
        {"code":"CD","name":"Congo (DRC)","dialCode":"+243","flag":"🇨🇩","pattern":"### ### ###"},
        {"code":"CF","name":"Central African Republic","dialCode":"+236","flag":"🇨🇫","pattern":"## ## ## ##"},
        {"code":"CG","name":"Congo (Republic)","dialCode":"+242","flag":"🇨🇬","pattern":"## ### ####"},
        {"code":"CH","name":"Switzerland","dialCode":"+41","flag":"🇨🇭","pattern":"## ### ## ##","trunk":"0","national_pattern":"0## ### ## ##"},
        {"code":"CI","name":"Côte d'Ivoire","dialCode":"+225","flag":"🇨🇮","pattern":"## ## ## ##"},
        {"code":"CK","name":"Cook Islands","dialCode":"+682","flag":"🇨🇰","pattern":"## ###"},
        {"code":"CL","name":"Chile","dialCode":"+56","flag":"🇨🇱","pattern":"# #### ####"},
        {"code":"CM","name":"Cameroon","dialCode":"+237","flag":"🇨🇲","pattern":"#### ## ## ##"},
        {"code":"CN","name":"China","dialCode":"+86","flag":"🇨🇳","pattern":"### #### ####"},
        {"code":"CO","name":"Colombia","dialCode":"+57","flag":"🇨🇴","pattern":"### ### ####"},
        {"code":"CR","name":"Costa Rica","dialCode":"+506","flag":"🇨🇷","pattern":"#### ####"},
        {"code":"CU","name":"Cuba","dialCode":"+53","flag":"🇨🇺","pattern":"# ### ####"},
        {"code":"CV","name":"Cape Verde","dialCode":"+238","flag":"🇨🇻","pattern":"### ####"},
        {"code":"CW","name":"Curaçao","dialCode":"+599","flag":"🇨🇼","pattern":"# ### ####"},
        {"code":"CX","name":"Christmas Island","dialCode":"+61","flag":"🇨🇽","pattern":"### ### ###"},
        {"code":"CY","name":"Cyprus","dialCode":"+357","flag":"🇨🇾","pattern":"## ######"},
        {"code":"CZ","name":"Czech Republic","dialCode":"+420","flag":"🇨🇿","pattern":"### ### ###"},

        // D
        {"code":"DE","name":"Germany","dialCode":"+49","flag":"🇩🇪","pattern":"#### #######","trunk":"0","national_pattern":"0#### #######"},
        {"code":"DJ","name":"Djibouti","dialCode":"+253","flag":"🇩🇯","pattern":"## ## ## ##"},
        {"code":"DK","name":"Denmark","dialCode":"+45","flag":"🇩🇰","pattern":"## ## ## ##"},
        {"code":"DM","name":"Dominica","dialCode":"+1","flag":"🇩🇲","pattern":"(###) ###-####"},
        {"code":"DO","name":"Dominican Republic","dialCode":"+1","flag":"🇩🇴","pattern":"(###) ###-####"},
        {"code":"DZ","name":"Algeria","dialCode":"+213","flag":"🇩🇿","pattern":"### ## ## ##","trunk":"0","national_pattern":"0### ## ## ##"},

        // E
        {"code":"EC","name":"Ecuador","dialCode":"+593","flag":"🇪🇨","pattern":"## ### ####"},
        {"code":"EE","name":"Estonia","dialCode":"+372","flag":"🇪🇪","pattern":"### ####"},
        {"code":"EG","name":"Egypt","dialCode":"+20","flag":"🇪🇬","pattern":"### ### ####","trunk":"0","national_pattern":"0### ### ####"},
        {"code":"EH","name":"Western Sahara","dialCode":"+212","flag":"🇪🇭","pattern":"###-######"},
        {"code":"ER","name":"Eritrea","dialCode":"+291","flag":"🇪🇷","pattern":"# ### ###"},
        {"code":"ES","name":"Spain","dialCode":"+34","flag":"🇪🇸","pattern":"### ### ###"},
        {"code":"ET","name":"Ethiopia","dialCode":"+251","flag":"🇪🇹","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},

        // F
        {"code":"FI","name":"Finland","dialCode":"+358","flag":"🇫🇮","pattern":"## ### ## ##","trunk":"0","national_pattern":"0## ### ## ##"},
        {"code":"FJ","name":"Fiji","dialCode":"+679","flag":"🇫🇯","pattern":"### ####"},
        {"code":"FK","name":"Falkland Islands","dialCode":"+500","flag":"🇫🇰","pattern":"#####"},
        {"code":"FM","name":"Micronesia","dialCode":"+691","flag":"🇫🇲","pattern":"### ####"},
        {"code":"FO","name":"Faroe Islands","dialCode":"+298","flag":"🇫🇴","pattern":"######"},
        {"code":"FR","name":"France","dialCode":"+33","flag":"🇫🇷","pattern":"# ## ## ## ##","trunk":"0","national_pattern":"0# ## ## ## ##"},

        // G
        {"code":"GA","name":"Gabon","dialCode":"+241","flag":"🇬🇦","pattern":"## ## ## ##"},
        {"code":"GB","name":"United Kingdom","dialCode":"+44","flag":"🇬🇧","pattern":"##### ######","trunk":"0","national_pattern":"0#### ######"},
        {"code":"GD","name":"Grenada","dialCode":"+1","flag":"🇬🇩","pattern":"(###) ###-####"},
        {"code":"GE","name":"Georgia","dialCode":"+995","flag":"🇬🇪","pattern":"### ### ###"},
        {"code":"GF","name":"French Guiana","dialCode":"+594","flag":"🇬🇫","pattern":"### ## ## ##"},
        {"code":"GG","name":"Guernsey","dialCode":"+44","flag":"🇬🇬","pattern":"##### ######"},
        {"code":"GH","name":"Ghana","dialCode":"+233","flag":"🇬🇭","pattern":"### ### ###","trunk":"0","national_pattern":"0### ### ###"},
        {"code":"GI","name":"Gibraltar","dialCode":"+350","flag":"🇬🇮","pattern":"### #####"},
        {"code":"GL","name":"Greenland","dialCode":"+299","flag":"🇬🇱","pattern":"## ## ##"},
        {"code":"GM","name":"Gambia","dialCode":"+220","flag":"🇬🇲","pattern":"### ####"},
        {"code":"GN","name":"Guinea","dialCode":"+224","flag":"🇬🇳","pattern":"### ## ## ##"},
        {"code":"GP","name":"Guadeloupe","dialCode":"+590","flag":"🇬🇵","pattern":"### ## ## ##"},
        {"code":"GQ","name":"Equatorial Guinea","dialCode":"+240","flag":"🇬🇶","pattern":"### ### ###"},
        {"code":"GR","name":"Greece","dialCode":"+30","flag":"🇬🇷","pattern":"### ### ####","trunk":"0","national_pattern":"0### ### ####"},
        {"code":"GS","name":"South Georgia","dialCode":"+500","flag":"🇬🇸","pattern":"#####"},
        {"code":"GT","name":"Guatemala","dialCode":"+502","flag":"🇬🇹","pattern":"#### ####"},
        {"code":"GU","name":"Guam","dialCode":"+1","flag":"🇬🇺","pattern":"(###) ###-####"},
        {"code":"GW","name":"Guinea-Bissau","dialCode":"+245","flag":"🇬🇼","pattern":"### ####"},
        {"code":"GY","name":"Guyana","dialCode":"+592","flag":"🇬🇾","pattern":"### ####"},

        // H
        {"code":"HK","name":"Hong Kong","dialCode":"+852","flag":"🇭🇰","pattern":"#### ####"},
        {"code":"HM","name":"Heard Island","dialCode":"+672","flag":"🇭🇲","pattern":"### ###"},
        {"code":"HN","name":"Honduras","dialCode":"+504","flag":"🇭🇳","pattern":"####-####"},
        {"code":"HR","name":"Croatia","dialCode":"+385","flag":"🇭🇷","pattern":"## ### ###","trunk":"0","national_pattern":"0## ### ###"},
        {"code":"HT","name":"Haiti","dialCode":"+509","flag":"🇭🇹","pattern":"## ## ####"},
        {"code":"HU","name":"Hungary","dialCode":"+36","flag":"🇭🇺","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},

        // I
        {"code":"ID","name":"Indonesia","dialCode":"+62","flag":"🇮🇩","pattern":"###-###-####","trunk":"0","national_pattern":"0###-###-####"},
        {"code":"IE","name":"Ireland","dialCode":"+353","flag":"🇮🇪","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},
        {"code":"IL","name":"Israel","dialCode":"+972","flag":"🇮🇱","pattern":"#-###-####"},
        {"code":"IM","name":"Isle of Man","dialCode":"+44","flag":"🇮🇲","pattern":"##### ######"},
        {"code":"IN","name":"India","dialCode":"+91","flag":"🇮🇳","pattern":"##### #####","trunk":"0","national_pattern":"0##### #####"},
        {"code":"IO","name":"British Indian Ocean Territory","dialCode":"+246","flag":"🇮🇴","pattern":"### ####"},
        {"code":"IQ","name":"Iraq","dialCode":"+964","flag":"🇮🇶","pattern":"### ### ####","trunk":"0","national_pattern":"0### ### ####"},
        {"code":"IR","name":"Iran","dialCode":"+98","flag":"🇮🇷","pattern":"### ### ####","trunk":"0","national_pattern":"0### ### ####"},
        {"code":"IS","name":"Iceland","dialCode":"+354","flag":"🇮🇸","pattern":"### ####"},
        {"code":"IT","name":"Italy","dialCode":"+39","flag":"🇮🇹","pattern":"### ### ####","trunk":"0","national_pattern":"0## ### ####"},

        // J
        {"code":"JE","name":"Jersey","dialCode":"+44","flag":"🇯🇪","pattern":"##### ######"},
        {"code":"JM","name":"Jamaica","dialCode":"+1","flag":"🇯🇲","pattern":"(###) ###-####"},
        {"code":"JO","name":"Jordan","dialCode":"+962","flag":"🇯🇴","pattern":"# #### ####"},
        {"code":"JP","name":"Japan","dialCode":"+81","flag":"🇯🇵","pattern":"##-####-####","trunk":"0","national_pattern":"0##-####-####"},

        // K
        {"code":"KE","name":"Kenya","dialCode":"+254","flag":"🇰🇪","pattern":"### ######","trunk":"0","national_pattern":"0### ######"},
        {"code":"KG","name":"Kyrgyzstan","dialCode":"+996","flag":"🇰🇬","pattern":"### ### ###"},
        {"code":"KH","name":"Cambodia","dialCode":"+855","flag":"🇰🇭","pattern":"## ### ###"},
        {"code":"KI","name":"Kiribati","dialCode":"+686","flag":"🇰🇮","pattern":"## ###"},
        {"code":"KM","name":"Comoros","dialCode":"+269","flag":"🇰🇲","pattern":"### ## ##"},
        {"code":"KN","name":"Saint Kitts and Nevis","dialCode":"+1","flag":"🇰🇳","pattern":"(###) ###-####"},
        {"code":"KP","name":"North Korea","dialCode":"+850","flag":"🇰🇵","pattern":"###-####-###"},
        {"code":"KR","name":"South Korea","dialCode":"+82","flag":"🇰🇷","pattern":"##-####-####","trunk":"0","national_pattern":"0##-####-####"},
        {"code":"KW","name":"Kuwait","dialCode":"+965","flag":"🇰🇼","pattern":"#### ####"},
        {"code":"KY","name":"Cayman Islands","dialCode":"+1","flag":"🇰🇾","pattern":"(###) ###-####"},
        {"code":"KZ","name":"Kazakhstan","dialCode":"+7","flag":"🇰🇿","pattern":"(###) ###-##-##"},

        // L
        {"code":"LA","name":"Laos","dialCode":"+856","flag":"🇱🇦","pattern":"## ### ###"},
        {"code":"LB","name":"Lebanon","dialCode":"+961","flag":"🇱🇧","pattern":"## ### ###"},
        {"code":"LC","name":"Saint Lucia","dialCode":"+1","flag":"🇱🇨","pattern":"(###) ###-####"},
        {"code":"LI","name":"Liechtenstein","dialCode":"+423","flag":"🇱🇮","pattern":"### ####"},
        {"code":"LK","name":"Sri Lanka","dialCode":"+94","flag":"🇱🇰","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},
        {"code":"LR","name":"Liberia","dialCode":"+231","flag":"🇱🇷","pattern":"## ### ###"},
        {"code":"LS","name":"Lesotho","dialCode":"+266","flag":"🇱🇸","pattern":"#### ####"},
        {"code":"LT","name":"Lithuania","dialCode":"+370","flag":"🇱🇹","pattern":"### ## ###"},
        {"code":"LU","name":"Luxembourg","dialCode":"+352","flag":"🇱🇺","pattern":"### ### ###"},
        {"code":"LV","name":"Latvia","dialCode":"+371","flag":"🇱🇻","pattern":"## ### ###"},
        {"code":"LY","name":"Libya","dialCode":"+218","flag":"🇱🇾","pattern":"##-#######"},

        // M
        {"code":"MA","name":"Morocco","dialCode":"+212","flag":"🇲🇦","pattern":"###-######","trunk":"0","national_pattern":"0###-######"},
        {"code":"MC","name":"Monaco","dialCode":"+377","flag":"🇲🇨","pattern":"## ## ## ##"},
        {"code":"MD","name":"Moldova","dialCode":"+373","flag":"🇲🇩","pattern":"## ###-###"},
        {"code":"ME","name":"Montenegro","dialCode":"+382","flag":"🇲🇪","pattern":"## ### ###","trunk":"0","national_pattern":"0## ### ###"},
        {"code":"MF","name":"Saint Martin","dialCode":"+590","flag":"🇲🇫","pattern":"### ## ## ##"},
        {"code":"MG","name":"Madagascar","dialCode":"+261","flag":"🇲🇬","pattern":"## ## ### ##"},
        {"code":"MH","name":"Marshall Islands","dialCode":"+692","flag":"🇲🇭","pattern":"###-####"},
        {"code":"MK","name":"North Macedonia","dialCode":"+389","flag":"🇲🇰","pattern":"## ### ###","trunk":"0","national_pattern":"0## ### ###"},
        {"code":"ML","name":"Mali","dialCode":"+223","flag":"🇲🇱","pattern":"## ## ## ##"},
        {"code":"MM","name":"Myanmar","dialCode":"+95","flag":"🇲🇲","pattern":"### ### ####","trunk":"0","national_pattern":"0### ### ####"},
        {"code":"MN","name":"Mongolia","dialCode":"+976","flag":"🇲🇳","pattern":"#### ####"},
        {"code":"MO","name":"Macau","dialCode":"+853","flag":"🇲🇴","pattern":"#### ####"},
        {"code":"MP","name":"Northern Mariana Islands","dialCode":"+1","flag":"🇲🇵","pattern":"(###) ###-####"},
        {"code":"MQ","name":"Martinique","dialCode":"+596","flag":"🇲🇶","pattern":"### ## ## ##"},
        {"code":"MR","name":"Mauritania","dialCode":"+222","flag":"🇲🇷","pattern":"## ## ## ##"},
        {"code":"MS","name":"Montserrat","dialCode":"+1","flag":"🇲🇸","pattern":"(###) ###-####"},
        {"code":"MT","name":"Malta","dialCode":"+356","flag":"🇲🇹","pattern":"#### ####"},
        {"code":"MU","name":"Mauritius","dialCode":"+230","flag":"🇲🇺","pattern":"#### ####"},
        {"code":"MV","name":"Maldives","dialCode":"+960","flag":"🇲🇻","pattern":"###-####"},
        {"code":"MW","name":"Malawi","dialCode":"+265","flag":"🇲🇼","pattern":"### ## ## ##","trunk":"0","national_pattern":"0### ## ## ##"},
        {"code":"MX","name":"Mexico","dialCode":"+52","flag":"🇲🇽","pattern":"### ### ####"},
        {"code":"MY","name":"Malaysia","dialCode":"+60","flag":"🇲🇾","pattern":"##-### ####","trunk":"0","national_pattern":"0##-### ####"},
        {"code":"MZ","name":"Mozambique","dialCode":"+258","flag":"🇲🇿","pattern":"## ### ###"},

        // N
        {"code":"NA","name":"Namibia","dialCode":"+264","flag":"🇳🇦","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},
        {"code":"NC","name":"New Caledonia","dialCode":"+687","flag":"🇳🇨","pattern":"## ## ##"},
        {"code":"NE","name":"Niger","dialCode":"+227","flag":"🇳🇪","pattern":"## ## ## ##"},
        {"code":"NF","name":"Norfolk Island","dialCode":"+672","flag":"🇳🇫","pattern":"### ###"},
        {"code":"NG","name":"Nigeria","dialCode":"+234","flag":"🇳🇬","pattern":"### ### ####","trunk":"0","national_pattern":"0### ### ####"},
        {"code":"NI","name":"Nicaragua","dialCode":"+505","flag":"🇳🇮","pattern":"#### ####"},
        {"code":"NL","name":"Netherlands","dialCode":"+31","flag":"🇳🇱","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},
        {"code":"NO","name":"Norway","dialCode":"+47","flag":"🇳🇴","pattern":"### ## ###"},
        {"code":"NP","name":"Nepal","dialCode":"+977","flag":"🇳🇵","pattern":"##-###-###"},
        {"code":"NR","name":"Nauru","dialCode":"+674","flag":"🇳🇷","pattern":"### ####"},
        {"code":"NU","name":"Niue","dialCode":"+683","flag":"🇳🇺","pattern":"####"},
        {"code":"NZ","name":"New Zealand","dialCode":"+64","flag":"🇳🇿","pattern":"##-###-####","trunk":"0","national_pattern":"0##-###-####"},

        // O
        {"code":"OM","name":"Oman","dialCode":"+968","flag":"🇴🇲","pattern":"#### ####"},

        // P
        {"code":"PA","name":"Panama","dialCode":"+507","flag":"🇵🇦","pattern":"####-####"},
        {"code":"PE","name":"Peru","dialCode":"+51","flag":"🇵🇪","pattern":"### ### ###"},
        {"code":"PF","name":"French Polynesia","dialCode":"+689","flag":"🇵🇫","pattern":"## ## ##"},
        {"code":"PG","name":"Papua New Guinea","dialCode":"+675","flag":"🇵🇬","pattern":"### ####"},
        {"code":"PH","name":"Philippines","dialCode":"+63","flag":"🇵🇭","pattern":"### ### ####","trunk":"0","national_pattern":"0### ### ####"},
        {"code":"PK","name":"Pakistan","dialCode":"+92","flag":"🇵🇰","pattern":"### ### ####","trunk":"0","national_pattern":"0### ### ####"},
        {"code":"PL","name":"Poland","dialCode":"+48","flag":"🇵🇱","pattern":"### ### ###"},
        {"code":"PM","name":"Saint Pierre and Miquelon","dialCode":"+508","flag":"🇵🇲","pattern":"## ## ##"},
        {"code":"PN","name":"Pitcairn Islands","dialCode":"+64","flag":"🇵🇳","pattern":"##-###-####"},
        {"code":"PR","name":"Puerto Rico","dialCode":"+1","flag":"🇵🇷","pattern":"(###) ###-####"},
        {"code":"PS","name":"Palestine","dialCode":"+970","flag":"🇵🇸","pattern":"### ### ###"},
        {"code":"PT","name":"Portugal","dialCode":"+351","flag":"🇵🇹","pattern":"### ### ###"},
        {"code":"PW","name":"Palau","dialCode":"+680","flag":"🇵🇼","pattern":"### ####"},
        {"code":"PY","name":"Paraguay","dialCode":"+595","flag":"🇵🇾","pattern":"### ######"},

        // Q
        {"code":"QA","name":"Qatar","dialCode":"+974","flag":"🇶🇦","pattern":"#### ####"},

        // R
        {"code":"RE","name":"Réunion","dialCode":"+262","flag":"🇷🇪","pattern":"### ## ## ##"},
        {"code":"RO","name":"Romania","dialCode":"+40","flag":"🇷🇴","pattern":"### ### ###","trunk":"0","national_pattern":"0### ### ###"},
        {"code":"RS","name":"Serbia","dialCode":"+381","flag":"🇷🇸","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},
        {"code":"RU","name":"Russia","dialCode":"+7","flag":"🇷🇺","pattern":"(###) ###-##-##"},
        {"code":"RW","name":"Rwanda","dialCode":"+250","flag":"🇷🇼","pattern":"### ### ###","trunk":"0","national_pattern":"0### ### ###"},

        // S
        {"code":"SA","name":"Saudi Arabia","dialCode":"+966","flag":"🇸🇦","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},
        {"code":"SB","name":"Solomon Islands","dialCode":"+677","flag":"🇸🇧","pattern":"## ###"},
        {"code":"SC","name":"Seychelles","dialCode":"+248","flag":"🇸🇨","pattern":"# ### ###"},
        {"code":"SD","name":"Sudan","dialCode":"+249","flag":"🇸🇩","pattern":"### ### ###","trunk":"0","national_pattern":"0### ### ###"},
        {"code":"SE","name":"Sweden","dialCode":"+46","flag":"🇸🇪","pattern":"##-### ## ##","trunk":"0","national_pattern":"0##-### ## ##"},
        {"code":"SG","name":"Singapore","dialCode":"+65","flag":"🇸🇬","pattern":"#### ####"},
        {"code":"SH","name":"Saint Helena","dialCode":"+290","flag":"🇸🇭","pattern":"####"},
        {"code":"SI","name":"Slovenia","dialCode":"+386","flag":"🇸🇮","pattern":"## ### ###","trunk":"0","national_pattern":"0## ### ###"},
        {"code":"SJ","name":"Svalbard and Jan Mayen","dialCode":"+47","flag":"🇸🇯","pattern":"### ## ###"},
        {"code":"SK","name":"Slovakia","dialCode":"+421","flag":"🇸🇰","pattern":"### ### ###"},
        {"code":"SL","name":"Sierra Leone","dialCode":"+232","flag":"🇸🇱","pattern":"## ######"},
        {"code":"SM","name":"San Marino","dialCode":"+378","flag":"🇸🇲","pattern":"#### ######"},
        {"code":"SN","name":"Senegal","dialCode":"+221","flag":"🇸🇳","pattern":"## ### ## ##"},
        {"code":"SO","name":"Somalia","dialCode":"+252","flag":"🇸🇴","pattern":"## ### ###"},
        {"code":"SR","name":"Suriname","dialCode":"+597","flag":"🇸🇷","pattern":"###-####"},
        {"code":"SS","name":"South Sudan","dialCode":"+211","flag":"🇸🇸","pattern":"### ### ###"},
        {"code":"ST","name":"São Tomé and Príncipe","dialCode":"+239","flag":"🇸🇹","pattern":"### ####"},
        {"code":"SV","name":"El Salvador","dialCode":"+503","flag":"🇸🇻","pattern":"#### ####"},
        {"code":"SX","name":"Sint Maarten","dialCode":"+1","flag":"🇸🇽","pattern":"(###) ###-####"},
        {"code":"SY","name":"Syria","dialCode":"+963","flag":"🇸🇾","pattern":"### ### ###"},
        {"code":"SZ","name":"Eswatini","dialCode":"+268","flag":"🇸🇿","pattern":"#### ####"},

        // T
        {"code":"TC","name":"Turks and Caicos Islands","dialCode":"+1","flag":"🇹🇨","pattern":"(###) ###-####"},
        {"code":"TD","name":"Chad","dialCode":"+235","flag":"🇹🇩","pattern":"## ## ## ##"},
        {"code":"TF","name":"French Southern Territories","dialCode":"+262","flag":"🇹🇫","pattern":"### ## ## ##"},
        {"code":"TG","name":"Togo","dialCode":"+228","flag":"🇹🇬","pattern":"## ## ## ##"},
        {"code":"TH","name":"Thailand","dialCode":"+66","flag":"🇹🇭","pattern":"##-###-####","trunk":"0","national_pattern":"0##-###-####"},
        {"code":"TJ","name":"Tajikistan","dialCode":"+992","flag":"🇹🇯","pattern":"## ### ####"},
        {"code":"TK","name":"Tokelau","dialCode":"+690","flag":"🇹🇰","pattern":"####"},
        {"code":"TL","name":"Timor-Leste","dialCode":"+670","flag":"🇹🇱","pattern":"### ####"},
        {"code":"TM","name":"Turkmenistan","dialCode":"+993","flag":"🇹🇲","pattern":"## ##-##-##"},
        {"code":"TN","name":"Tunisia","dialCode":"+216","flag":"🇹🇳","pattern":"## ### ###"},
        {"code":"TO","name":"Tonga","dialCode":"+676","flag":"🇹🇴","pattern":"#####"},
        {"code":"TR","name":"Turkey","dialCode":"+90","flag":"🇹🇷","pattern":"### ### ## ##","trunk":"0","national_pattern":"0### ### ## ##"},
        {"code":"TT","name":"Trinidad and Tobago","dialCode":"+1","flag":"🇹🇹","pattern":"(###) ###-####"},
        {"code":"TV","name":"Tuvalu","dialCode":"+688","flag":"🇹🇻","pattern":"######"},
        {"code":"TW","name":"Taiwan","dialCode":"+886","flag":"🇹🇼","pattern":"####-####"},
        {"code":"TZ","name":"Tanzania","dialCode":"+255","flag":"🇹🇿","pattern":"### ### ###","trunk":"0","national_pattern":"0### ### ###"},

        // U
        {"code":"UA","name":"Ukraine","dialCode":"+380","flag":"🇺🇦","pattern":"## ###-##-##","trunk":"0","national_pattern":"0## ###-##-##"},
        {"code":"UG","name":"Uganda","dialCode":"+256","flag":"🇺🇬","pattern":"### ######","trunk":"0","national_pattern":"0### ######"},
        {"code":"UM","name":"U.S. Outlying Islands","dialCode":"+1","flag":"🇺🇲","pattern":"(###) ###-####"},
        {"code":"US","name":"United States","dialCode":"+1","flag":"🇺🇸","pattern":"(###) ###-####"},
        {"code":"UY","name":"Uruguay","dialCode":"+598","flag":"🇺🇾","pattern":"#### ####"},
        {"code":"UZ","name":"Uzbekistan","dialCode":"+998","flag":"🇺🇿","pattern":"## ###-##-##"},

        // V
        {"code":"VA","name":"Vatican City","dialCode":"+39","flag":"🇻🇦","pattern":"### ### ####"},
        {"code":"VC","name":"Saint Vincent and the Grenadines","dialCode":"+1","flag":"🇻🇨","pattern":"(###) ###-####"},
        {"code":"VE","name":"Venezuela","dialCode":"+58","flag":"🇻🇪","pattern":"###-#######"},
        {"code":"VG","name":"British Virgin Islands","dialCode":"+1","flag":"🇻🇬","pattern":"(###) ###-####"},
        {"code":"VI","name":"U.S. Virgin Islands","dialCode":"+1","flag":"🇻🇮","pattern":"(###) ###-####"},
        {"code":"VN","name":"Vietnam","dialCode":"+84","flag":"🇻🇳","pattern":"###-###-####","trunk":"0","national_pattern":"0###-###-####"},
        {"code":"VU","name":"Vanuatu","dialCode":"+678","flag":"🇻🇺","pattern":"## ###"},

        // W
        {"code":"WF","name":"Wallis and Futuna","dialCode":"+681","flag":"🇼🇫","pattern":"## ## ##"},
        {"code":"WS","name":"Samoa","dialCode":"+685","flag":"🇼🇸","pattern":"##-####"},

        // Y
        {"code":"YE","name":"Yemen","dialCode":"+967","flag":"🇾🇪","pattern":"### ### ###"},
        {"code":"YT","name":"Mayotte","dialCode":"+262","flag":"🇾🇹","pattern":"### ## ## ##"},

        // Z
        {"code":"ZA","name":"South Africa","dialCode":"+27","flag":"🇿🇦","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},
        {"code":"ZM","name":"Zambia","dialCode":"+260","flag":"🇿🇲","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"},
        {"code":"ZW","name":"Zimbabwe","dialCode":"+263","flag":"🇿🇼","pattern":"## ### ####","trunk":"0","national_pattern":"0## ### ####"}
    ];

    const COUNTRY_LIST = DEFAULT_COUNTRIES;


    // =========================================================================
    // PREFERRED COUNTRIES FILTER
    // =========================================================================

    const preferred = parsePreferredList(preferred_country_list);
    let filteredList = COUNTRY_LIST;
    if (preferred.length > 0) {
        const f = COUNTRY_LIST.filter(c => preferred.includes(c.code));
        if (f.length > 0) filteredList = f;
    }


    // =========================================================================
    // STATE
    // =========================================================================

    const [selectedCountry, setSelectedCountry] = useState(filteredList[0]);
    const [phoneNumber, setPhoneNumber]         = useState("");
    const [isModalVisible, setIsModalVisible]   = useState(false);
    const [searchText, setSearchText]           = useState("");

    const [initialRaw, setInitialRaw]                 = useState("");
    const [shouldApplyInitial, setShouldApplyInitial] = useState(false);

    const initialApplied = useRef(false);


    // =========================================================================
    // PUBLISH COUNTRY STATES
    // =========================================================================

    useEffect(() => {
        if (!selectedCountry) return;
        publishState("country_name",     selectedCountry.name);
        publishState("ISO_country_name", selectedCountry.code);
        publishState("dial_code",        selectedCountry.dialCode);
    }, [selectedCountry]);


    // =========================================================================
    // INITIAL VALUE
    // =========================================================================

    useEffect(() => {
        if (initialApplied.current) return;
        if (!default_value && !default_dialCode) return;
    
        let c = selectedCountry;
    
        if (default_dialCode) {
            // Explicit country code provided — use it directly
            const found = COUNTRY_LIST.find(x => x.code === default_dialCode.toUpperCase());
            if (found) c = found;
        } else if (default_value) {
            // No explicit country — try to detect from the dial code in the number
            const clean = default_value.trim();
            if (clean.startsWith("+")) {
                // Sort by dial code length descending so "+1868" matches before "+1"
                const sorted = [...COUNTRY_LIST].sort(
                    (a, b) => b.dialCode.length - a.dialCode.length
                );
                const match = sorted.find(x => clean.startsWith(x.dialCode));
                if (match) c = match;
            }
        }
    
        const raw = parseDefaultValue(default_value || "", c);
        setSelectedCountry(c);
        setInitialRaw(raw);
        setShouldApplyInitial(true);
        initialApplied.current = true;
    }, [default_value, default_dialCode]);


    // =========================================================================
    // APPLY INITIAL FORMATTING
    // =========================================================================

    useEffect(() => {
        if (!shouldApplyInitial) return;

        const max       = getMaxDigits(initialRaw, selectedCountry);
        const trimmed   = initialRaw.slice(0, max);
        const formatted = enable_formatting ? formatPhone(trimmed, selectedCountry) : trimmed;

        setPhoneNumber(formatted);

        const withoutTrunk  = stripTrunk(trimmed, selectedCountry);
        const formattedIntl = enable_formatting ? formatDigits(withoutTrunk, selectedCountry.pattern) : withoutTrunk;
        const valid         = trimmed.length === max;

        // FIX: raw_number is a number state — publish a number or null, never a string
        publishState("raw_number",  trimmed ? Number(trimmed) : null);
        publishState("full_number", selectedCountry.dialCode + " " + formattedIntl);
        publishState("e164_number", selectedCountry.dialCode + withoutTrunk.replace(/\D/g, ""));
        publishState("is_valid",    valid);

        setShouldApplyInitial(false);
    }, [selectedCountry, shouldApplyInitial]);


    // =========================================================================
    // PHONE INPUT HANDLER
    // =========================================================================

    const handlePhone = (text) => {
        const raw     = text.replace(/\D/g, "");
        const max     = getMaxDigits(raw, selectedCountry);
        const trimmed = raw.slice(0, max);

        const formatted = enable_formatting ? formatPhone(trimmed, selectedCountry) : trimmed;
        setPhoneNumber(formatted);

        const withoutTrunk  = stripTrunk(trimmed, selectedCountry);
        const formattedIntl = enable_formatting ? formatDigits(withoutTrunk, selectedCountry.pattern) : withoutTrunk;
        const valid         = trimmed.length === max;

        // FIX: raw_number is a number state — publish a number or null, never a string
        publishState("raw_number",  trimmed ? Number(trimmed) : null);
        publishState("full_number", selectedCountry.dialCode + " " + formattedIntl);
        publishState("e164_number", selectedCountry.dialCode + withoutTrunk.replace(/\D/g, ""));
        publishState("is_valid",    valid);

        triggerEvent("phone_changed");
        if (valid) {
            triggerEvent("phone_valid");
        } else {
            triggerEvent("phone_invalid");
        }
    };


    // =========================================================================
    // COUNTRY SEARCH FILTER
    // =========================================================================

    const filteredCountries = useMemo(() => {
        const s = searchText.toLowerCase();
        return filteredList.filter(c =>
            c.name.toLowerCase().includes(s) ||
            c.dialCode.includes(s)
        );
    }, [searchText, filteredList]);


    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <View style={{ width: "100%" }}>

            {/* --- INPUT ROW --- */}
            <View style={{
                flexDirection: "row",
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 12,
                padding: 10,
                alignItems: "center"
            }}>

                {/* Country selector button */}
                <TouchableOpacity
                    onPress={() => {
                        setIsModalVisible(true);
                        triggerEvent("country_modal_opened");
                    }}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginRight: 10
                    }}
                >
                    {show_flag && (
                        <Text style={{ fontSize: 20, marginRight: 4, color: textColor }}>
                            {selectedCountry.flag}
                        </Text>
                    )}
                    {show_dial_code && (
                        <Text style={{ fontSize: 16, marginRight: 4, color: textColor }}>
                            {selectedCountry.dialCode}
                        </Text>
                    )}
                    <Text style={{ color: textColor }}>{dropdownArrowText}</Text>
                </TouchableOpacity>

                {/* Phone input */}
                <TextInput
                    style={{ flex: 1, fontSize: 18, color: textColor }}
                    placeholder={inputPlaceholder}
                    placeholderTextColor={placeholder_color}
                    value={phoneNumber}
                    onChangeText={handlePhone}
                    maxLength={getFormattedMaxLength(phoneNumber, selectedCountry)}
                    keyboardType="phone-pad"
                    onFocus={() => triggerEvent("input_focused")}
                    onBlur={() => triggerEvent("input_blurred")}
                />
            </View>


            {/* --- COUNTRY MODAL --- */}
            <Modal
                visible={isModalVisible}
                statusBarTranslucent={false}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
                    <View style={{ flex: 1 }}>

                        {/* Header */}
                        <View style={{
                            paddingTop: modalTopPadding,
                            paddingHorizontal: 16,
                            paddingBottom: 16,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottomWidth: 1,
                            borderColor: "#ddd"
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: "600" }}>
                                Select Country
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsModalVisible(false);
                                    triggerEvent("country_modal_closed");
                                }}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Text style={{ fontSize: 22 }}>{closeModalText}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <TextInput
                            style={{
                                margin: 12,
                                padding: 10,
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8
                            }}
                            placeholder="Search country"
                            value={searchText}
                            onChangeText={setSearchText}
                        />

                        {/* Country list */}
                        <ScrollView>
                            {filteredCountries.map(c => (
                                <TouchableOpacity
                                    key={c.code}
                                    onPress={() => {
                                        setSelectedCountry(c);
                                        setPhoneNumber("");
                                        // FIX: raw_number is a number state — reset with null, not ""
                                        publishState("raw_number",  null);
                                        publishState("full_number", "");
                                        publishState("e164_number", "");
                                        publishState("is_valid",    false);
                                        setIsModalVisible(false);
                                        triggerEvent("country_changed");
                                        triggerEvent("country_modal_closed");
                                    }}
                                    style={{
                                        padding: 14,
                                        borderBottomWidth: 1,
                                        borderColor: "#eee",
                                        flexDirection: "row",
                                        alignItems: "center"
                                    }}
                                >
                                    {show_flag && (
                                        <Text style={{ fontSize: 22, marginRight: 10 }}>
                                            {c.flag}
                                        </Text>
                                    )}
                                    <Text style={{ flex: 1, fontSize: 16 }}>
                                        {c.name}
                                    </Text>
                                    {show_dial_code && (
                                        <Text style={{ fontSize: 15 }}>
                                            {c.dialCode}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                    </View>
                </SafeAreaView>
            </Modal>

        </View>
    );
}