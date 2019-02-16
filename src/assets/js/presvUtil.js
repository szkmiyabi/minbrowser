module.exports = class presvUtil {

    static css_cut() {
        return `
            var d = document;
            var delarr = new Array();
            var links = d.getElementsByTagName("link");
            for(var i=0; i<links.length; i++) {
                var link = links.item(i);
                var href = link.getAttribute("href");
                if(is_css_file(href)) {
                    delarr.push(href);
                }
            }
            for(var i=0; i<delarr.length; i++) {
                var line = delarr[i];
                delete_link(line);
            }
            var tags = d.getElementsByTagName("*");
            for(var i=0; i<tags.length; i++) {
                var tag = tags.item(i);
                var style = tag.getAttribute("style");
                if(style !== null || style !== "") {
                    tag.removeAttribute("style");
                }
            }
            var styles = d.getElementsByTagName("style");
            for(i=0; i<styles.length; i++) {
                var style = styles.item(i);
                style.textContent = null;
            }
            function is_css_file(href) {
                var pat = new RegExp(".+\.css");
                if(pat.test(href)) return true;
                else return false;
            }
            function delete_link(line) {
                var lks = d.getElementsByTagName("link");
                for(var j=0; j<lks.length; j++) {
                    var lk = lks.item(j);
                    var hf = lk.getAttribute("href");
                    if(hf === line) {
                        lk.parentNode.removeChild(lk);
                        break;
                    }
                }
            }
            require("electron").ipcRenderer.send("cc-reply", 
                JSON.parse(JSON.stringify({status:"ok"}))
            );
        `;
    }

    static w3c_report() {
        return `
            var str = "";
            var crurl = location.href;
            if(crurl.indexOf(".org/nu/") > 0) {
                var rep_wrapper = document.getElementById("results");
                var errcnt = 0;
                var linept = new RegExp(/(From|At)( line )([0-9]+?)(,)/);
                var inwrap = rep_wrapper.getElementsByTagName("ol")[0];
                var rows = inwrap.getElementsByTagName("li");
                for(var i=0; i<rows.length; i++) {
                    var row = rows.item(i);
                    var atr = row.getAttribute("class");
                    if(atr === "error") {
                        errcnt++;
                        var emsg = row.getElementsByTagName("p")[0].getElementsByTagName("span")[0].innerText;
                        var eline = row.getElementsByClassName("location")[0].getElementsByTagName("a")[0].innerText;
                        var elinestr = "";
                        if(linept.test(eline)) {
                            elinestr = eline.match(linept)[3];
                        }
                        elinestr += "行目";
                        var esrc = row.getElementsByClassName("extract")[0].getElementsByTagName("code")[0].innerText;
                        str += elinestr + "<my:br>" + emsg + "<my:br><my:br>" + esrc + "<my:br><my:br><my:br>";
                    }
                }
            } else {
                var rep_wrapper = document.getElementById("error_loop");
                var errcnt = 0;
                var linept = new RegExp(/(Line )([0-9]+?)(,)/);
                var rows = rep_wrapper.getElementsByTagName("li");
                for(var i=0; i<rows.length; i++) {
                    var row = rows.item(i);
                    var atr = row.getAttribute("class");
                    if(atr === "msg_err") {
                        errcnt++;
                        var eline = row.getElementsByTagName("em")[0].innerText;
                        var elinestr = "";
                        if(linept.test(eline)) {
                            elinestr = eline.match(linept)[2];
                        }
                        elinestr += "行目";
                        var emsg = row.getElementsByClassName("msg")[0].innerText;
                        var esrc = row.getElementsByTagName("pre")[0].getElementsByTagName("code")[0].innerText;
                        str += elinestr + "<my:br>" + emsg + "<my:br><my:br>" + esrc + "<my:br><my:br><my:br>";
                    }
                }
            }
            var send_datas = JSON.parse(JSON.stringify({ reptext: str }));
            require("electron").ipcRenderer.send("reply", send_datas);
        `;
    }

    static image_alt() {
        return `
            var fname_flg = true;
            var img = document.getElementsByTagName("img");
            for(var i=0; i<img.length; i++) {
                var imgtag = img.item(i);
                imgtag.setAttribute("style", "border:1px solid red;");
                var span_id = "bkm-img-span-" + i;
                var src_val = imgtag.getAttribute("src");
                var fname = get_img_filename(src_val);
                var alt_val = imgtag.getAttribute("alt");
                if(alt_val === null) {
                    alt_val = alt_attr_from_dirtycode(imgtag);
                }
                var html_str = "";
                if(alt_attr_check(imgtag)) {
                    html_str += "alt: " + alt_val;
                } else {
                    html_str += "alt属性がない";
                }
                if(fname_flg) {
                    if(html_str !== "") {
                        html_str += ", filename: " + fname;
                    } else {
                        html_str += "filename: " + fname;
                    }
                }
                var css_txt = "color:#fff;font-size:12px;padding:1px;background:#BF0000;";
                var span = '<span id="' + span_id + '" style="' + css_txt + '">' + html_str + '</span>';
                imgtag.insertAdjacentHTML("beforebegin", span);
            }
            tag_link_img();
            function alt_attr_from_dirtycode(obj) {
                var ret = "";
                var imgtag = obj.outerHTML;
                var pt = new RegExp('(alt=")(.*?)(")');
                if(pt.test(imgtag)) {
                    ret = imgtag.match(pt)[2];
                }
                return ret;
            }
            function get_img_filename(str) {
                var ret = "";
                var pat = new RegExp("(.+)\/(.+\.)(JPG|jpg|GIF|gif|PNG|png|BMP|bmp)$");
                if(pat.test(str)) {
                    var arr = str.match(pat);
                    ret += arr[2] + arr[3];
                }
                return ret;
            }
            function alt_attr_check(imgtag) {
                var txt = imgtag.outerHTML;
                var pt1 = new RegExp('alt=".*"');
                var pt2 = new RegExp('alt=');
                if(pt1.test(txt) && pt2.test(txt)) return true;
                else return false;
            }
            function tag_link_img() {
                var ats = document.getElementsByTagName("a");
                var css_txt = "border:2px dotted red;";
                for(var i=0; i<ats.length; i++) {
                    var atag = ats.item(i);
                    var imgs = atag.getElementsByTagName("img");
                    for(var j=0; j<imgs.length; j++) {
                        var img = imgs.item(j);
                        img.setAttribute("style", css_txt);
                    }
                }
            }
            require("electron").ipcRenderer.send("alt-reply", 
                JSON.parse(JSON.stringify({status:"ok"}))
            );
        `;
    }

    static target_attr() {
        return `
            var ats = document.getElementsByTagName("a");
            for(var i=0; i<ats.length; i++) {
                var atag = ats.item(i);
                var ataghtml = atag.outerHTML;
                ataghtml = _text_clean(ataghtml);
                if(_target_attr_check(ataghtml)) {
                    var target_vl = atag.getAttribute("target");
                    var span_id = "bkm-target-attr-span-" + i;
                    var span_html = (target_vl === "") ? "target属性有:(空)" : "target属性有:" + target_vl;
                    var span_css = "padding-right:5px;color:#fff;font-size:13px;padding:1px;background:#008000;";
                    var span = '<span id="' + span_id + '" style="' + span_css + '">' + span_html + '</span>';
                    atag.insertAdjacentHTML("beforebegin", span);
                }
            }
            function _target_attr_check(str) {
                var pt = new RegExp('target=".*?"');
                if(pt.test(str)) return true;
                else return false;
            }
            function _text_clean(str) {
                var ret = "";
                ret = str.replace(new RegExp("^ +", "mg"), "");
                ret = ret.replace(new RegExp("\\t+", "mg"), "");
                ret = ret.replace(new RegExp("(\\r\\n|\\r|\\n)", "mg"), "");
                return str;
            }
            require("electron").ipcRenderer.send("target-reply", 
                JSON.parse(JSON.stringify({status:"ok"}))
            );
        `;
    }

    static semantic_check() {
        return `
            function tag_paragraph() {
                var ps = document.getElementsByTagName("p");
                for(var i=0; i<ps.length; i++) {
                    var p = ps.item(i);
                    p.setAttribute("style", "border:1px solid red; position: relative;");
                    add_label(p, i, "afterbegin", "#B94A48");
                }
            }
            function tag_heading() {
                var tags = ["h1", "h2", "h3", "h4", "h5", "h6"];
                var idx = tags.length;
                var in_funcs = new Array();
                for(var i=0; i<idx; i++) {
                    var val = tags[i];
                    in_funcs.push(make_funcs(val));
                }
                function make_funcs(tag) {
                    return function() {
                        var ts = document.getElementsByTagName(tag);
                        for(var i=0; i<ts.length; i++) {
                            var t = ts.item(i);
                            t.setAttribute("style", "border:1px solid red; position: relative;");
                            add_label(t, i, "afterbegin", "#B94A48");
                        }
                    }
                }
                for(var i=0; i<idx; i++) {
                    in_funcs[i]();
                }
            }
            function tag_br() {
                var brs = document.getElementsByTagName("br");
                for(var i=0; i<brs.length; i++) {
                    var br = brs.item(i);
                    var css_txt = "color:#fff;font-size:90%!important;padding:1px;border-radius:3px;";
                    var span = '<span id="bkm-br-span-"' + i + '" style="' + css_txt + 'background:#888888;">&lt;br&gt;</span>';
                    br.insertAdjacentHTML("beforebegin", span);
                }
            }
            function tag_semantic() {
                var tags = ["strong", "em", "address", "nav", "section"];
                var idx = tags.length;
                var in_funcs = new Array();
                for(var i=0; i<idx; i++) {
                    var val = tags[i];
                    in_funcs.push(make_funcs(val));
                }
                function make_funcs(tag) {
                    return function() {
                        var ts = document.getElementsByTagName(tag);
                        for(var i=0; i<ts.length; i++) {
                            var t = ts.item(i);
                            t.setAttribute("style", "border:1px solid red; position: relative;");
                            add_label(t, i, "afterbegin", "#888888");
                        }
                    }
                }
                for(var i=0; i<idx; i++) {
                    in_funcs[i]();
                }
            }
            function tag_list() {
                var tags = ["ul", "ol", "dl", "dt", "dd"];
                var idx = tags.length;
                var in_funcs = new Array();
                for(var i=0; i<idx; i++) {
                    var val = tags[i];
                    in_funcs.push(make_funcs(val));
                }
                function make_funcs(tag) {
                    return function() {
                        var ts = document.getElementsByTagName(tag);
                        for(var i=0; i<ts.length; i++) {
                            var t = ts.item(i);
                            t.setAttribute("style", "border:1px solid red; position: relative;");
                            add_label(t, i, "afterbegin", "#468847");
                        }
                    }
                }
                for(var i=0; i<idx; i++) {
                    in_funcs[i]();
                }
            }
            function tag_table() {
                var in_funcs = [
                    function() {
                        var tbls = document.getElementsByTagName("table");
                        for(var i=0; i<tbls.length; i++) {
                            var tbl = tbls.item(i);
                            tbl.setAttribute("style", "border:2px solid red!important; position: relative;");
                            add_label(tbl, i, "beforebegin", "#800000");
                        }
                        for(var i=0; i<tbls.length; i++) {
                            var tbl = tbls.item(i);
                            var smry = tbl.getAttribute("summary");
                            var span = document.getElementById("bkm-table-span-" + i);
                            var now_label_text = span.innerHTML;
                            var new_label_text = (smry === null) ? now_label_text : now_label_text + ", summary:" + smry;
                            span.innerHTML = new_label_text;
                        }
                    },
                    function() {
                        var cps = document.getElementsByTagName("caption");
                        for(var i=0; i<cps.length; i++) {
                            var cp = cps.item(i);
                            cp.setAttribute("style", "border:1px solid red!important; position: relative;");
                            add_label(cp, i, "afterbegin", "#800000");
                        }
                    },
                    function() {
                        var ths = document.getElementsByTagName("th");
                        for(var i=0; i<ths.length; i++) {
                            var th = ths.item(i);
                            th.setAttribute("style", "border:2px solid red!important; position: relative;");
                            add_label(th, i, "afterbegin", "#800000");
                        }
                        for(var i=0; i<ths.length; i++) {
                            var th = ths.item(i);
                            var scope = th.getAttribute("scope");
                            var span = document.getElementById("bkm-th-span-" + i);
                            var now_label_text = span.innerHTML;
                            var new_label_text = (scope===null) ? now_label_text : now_label_text + ", scope:" + scope;
                            span.innerHTML = new_label_text;
                        }
                    }
                ];
                for(var i=0; i<in_funcs.length; i++) {
                    in_funcs[i]();
                }
            }
            function add_label(obj, cnt, pos, colorcode) {
                var tag_name = obj.tagName;
                    tag_name = tag_name.toLowerCase();
                var span_id = "bkm-" + tag_name + "-span-" + cnt;
                var css_txt = "color:#fff;font-size:90%!important;font-weight:normal!important;padding:1px;border-radius:3px;";
                css_txt += 'background:' + colorcode + ';';
                var html_str = '&lt;' + tag_name + '&gt;';
                var span = '<span id="' + span_id + '" style="' + css_txt + '">' + html_str + '</span>';
                obj.insertAdjacentHTML(pos, span);
            }
            tag_paragraph();
            tag_heading();
            tag_br();
            tag_semantic();
            tag_list();
            tag_table();
            require("electron").ipcRenderer.send("struct-reply", 
                JSON.parse(JSON.stringify({status:"ok"}))
            );
        `;
    }

}