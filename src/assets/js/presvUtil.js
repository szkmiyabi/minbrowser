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

    static add_label() {
        return `
            var add_label = function(obj, cnt) {
                var d = document;
                var span = d.createElement("span");
                var tag_name = obj.tagName;
                    tag_name = tag_name.toLowerCase();
                var span_id = "bkm-" + tag_name + "-span-" + cnt;
                var css_txt = "color:#000;font-size:90%;opacity:0.8;display:block;border:1px solid red;padding:1px;background:yellow;position:absolute;top:2px;left:2px;";
                span.innerHTML = '&lt;' + tag_name + '&gt;';
                span.id = span_id;
                span.setAttribute("style", css_txt);
                obj.appendChild(span);
            };
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
            require("electron").ipcRenderer.send("alt-reply", 
                JSON.parse(JSON.stringify({status:"ok"}))
            );
        `;
    }

    static target_attr() {
        return `
            var ats = document.getElementsByTagName("a");
            var i = 0;
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
                    i++;
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
}