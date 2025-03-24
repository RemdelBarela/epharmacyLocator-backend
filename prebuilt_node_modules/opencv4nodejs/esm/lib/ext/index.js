import makeDrawUtils from './drawUtils.js';
import deprecations from './deprecations.js';
import misc from './misc.js';
export default function extendWithJsSources(cv) {
    // add functions
    makeDrawUtils(cv);
    // add functions
    misc(cv);
    // add wrapper on calcHist function
    deprecations(cv);
    return cv;
}
