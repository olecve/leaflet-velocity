(ns refresh-demo-data
  "Refreshes demo/data.js with a fresh GFS wind snapshot from NOAA. Run manually with
  `npm run refresh-demo-data` whenever you want the demo to show current-ish wind instead of a
  stale one. This is a one-time refresh, not scheduled automation.

  Requires the JVM and the Clojure CLI (`clj`/`clojure`) on PATH. deps.edn resolves the one real
  dependency (edu.ucar/grib, the netCDF-Java GRIB2 decoder) directly from Unidata's Maven repo."
  (:require [clojure.data.json :as json]
            [clojure.java.io :as io])
  (:import [java.net URI]
           [java.net.http HttpClient HttpRequest HttpRequest$BodyPublishers HttpResponse$BodyHandlers]
           [java.time Instant ZoneOffset]
           [java.time.format DateTimeFormatter]
           [java.time.temporal ChronoUnit]
           [ucar.grib.grib2 Grib2Data Grib2Input]
           [ucar.unidata.io RandomAccessFile]))

(def data-js-path "demo/data.js")

(defn log [message]
  (println (str "[refresh-demo-data] " message)))

(def http-client (HttpClient/newHttpClient))

(defn http-head-ok? [url]
  (let [request (-> (HttpRequest/newBuilder (URI/create url))
                     (.method "HEAD" (HttpRequest$BodyPublishers/noBody))
                     .build)
        response (.send http-client request (HttpResponse$BodyHandlers/discarding))]
    (<= 200 (.statusCode response) 299)))

(defn http-get-bytes [url]
  (let [request (.build (HttpRequest/newBuilder (URI/create url)))
        response (.send http-client request (HttpResponse$BodyHandlers/ofByteArray))]
    (when-not (<= 200 (.statusCode response) 299)
      (throw (ex-info (str "HTTP " (.statusCode response) " for " url) {})))
    (.body response)))

(defn find-latest-run
  "Finds the most recently published GFS run by walking backward from now over 6-hourly cycles."
  []
  (loop [steps-back 0]
    (when (>= steps-back 12)
      (throw (ex-info "Could not find a published GFS run in the last 3 days." {})))
    (let [candidate (.minusSeconds (Instant/now) (* steps-back 6 3600))
          utc (.atZone candidate ZoneOffset/UTC)
          cycle-hour (* 6 (quot (.getHour utc) 6))
          run-date (-> utc (.truncatedTo ChronoUnit/DAYS) (.withHour cycle-hour))
          date-str (.format run-date (DateTimeFormatter/ofPattern "yyyyMMdd"))
          hour-str (format "%02d" cycle-hour)
          idx-url (str "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs." date-str "/" hour-str
                        "/atmos/gfs.t" hour-str "z.pgrb2.1p00.f000.idx")]
      (if (http-head-ok? idx-url)
        {:date-str date-str :hour-str hour-str}
        (recur (inc steps-back))))))

(defn download-wind-subset [{:keys [date-str hour-str]}]
  (let [url (str "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl?file=gfs.t"
                 hour-str
                 "z.pgrb2.1p00.f000"
                 "&var_UGRD=on&var_VGRD=on&lev_10_m_above_ground=on"
                 "&dir=%2Fgfs."
                 date-str
                 "%2F"
                 hour-str
                 "%2Fatmos")]
    (log (str "Downloading GFS " date-str " " hour-str "Z wind subset..."))
    (let [bytes (http-get-bytes url)]
      (log (format "Downloaded %d KB" (quot (alength bytes) 1024)))
      bytes)))

(defn format-ref-time [epoch-millis]
  (.format (DateTimeFormatter/ofPattern "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            (.atZone (Instant/ofEpochMilli epoch-millis) ZoneOffset/UTC)))

(defn decode-wind-records
  "Reads the two 10m-wind records (U and V components) directly via the netCDF-Java GRIB2 decoder."
  [grib-bytes]
  (let [tmp (java.io.File/createTempFile "gfs-wind" ".grib2")]
    (try
      (io/copy grib-bytes tmp)
      (let [raf (doto (RandomAccessFile. (.getPath tmp) "r") (.order RandomAccessFile/BIG_ENDIAN))]
        (try
          (let [input (Grib2Input. raf)]
            (.scan input false false)
            (let [records (.getRecords input)
                  grib-data (Grib2Data. raf)]
              (doall
               (for [record records]
                 (let [pds (.getPdsVars (.getPDS record))
                       gds (.getGdsVars (.getGDS record))
                       ids (.getId record)
                       data (.getData grib-data (.getGdsOffset record) (.getPdsOffset record) (.getRefTime ids))]
                   {:header {:parameterCategory (.getParameterCategory pds)
                             :parameterNumber (.getParameterNumber pds)
                             :dx (.getDx gds)
                             :dy (.getDy gds)
                             :la1 (.getLa1 gds)
                             :la2 (.getLa2 gds)
                             :lo1 (.getLo1 gds)
                             :lo2 (.getLo2 gds)
                             :nx (.getNx gds)
                             :ny (.getNy gds)
                             :refTime (format-ref-time (.getRefTime ids))}
                    :data data})))))
          (finally (.close raf))))
      (finally (.delete tmp)))))

(defn write-demo-data! [records]
  (when (not= (count records) 2)
    (throw (ex-info (str "Expected 2 records (U and V wind components), got " (count records)) {})))
  (let [json-records (mapv (fn [{:keys [header data]}] {:header header :data (vec data)}) records)
        contents (str "var data=\n" (json/write-str json-records) "\nexport default data;\n")]
    (spit data-js-path contents)
    (log (format "Wrote %.2f MB to %s" (/ (count contents) 1024.0 1024.0) data-js-path))
    (log (str "refTime: " (:refTime (:header (first records)))))))

(defn -main [& _args]
  (let [run (find-latest-run)]
    (log (str "Using GFS run " (:date-str run) " " (:hour-str run) "Z"))
    (let [grib-bytes (download-wind-subset run)
          records (decode-wind-records grib-bytes)]
      (write-demo-data! records)
      (log "Done. Review the diff, then run `npm run build:demo` to verify before committing."))))

(apply -main *command-line-args*)
