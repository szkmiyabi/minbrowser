module.exports = class presvUtil {

    static css_cut() {
        return `
            var err = "noerror";
            var links = document.getElementsByTagName("link");
            for(var i=0; i<links.length; i++) {
                var link = links.item(i);
                link.removeAttribute("href");
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
                var span = document.createElement("span");
                span.id = "bkm-img-span-" + i;
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
                span.innerHTML = html_str;
                var css_txt = "color:#fff;font-size:12px;padding:1px;background:#BF0000;";
                span.setAttribute("style", css_txt);
                imgtag.parentNode.insertBefore(span, imgtag.nextSibling);
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
}