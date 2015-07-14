# rxnorm-js
===========

RxNorm and OpenFDA Medication Database querying. This library provides the following exports:

* queryfdaCode - search adverse events for drugs using RxNorm
* queryfdaName - search adverse events for drugs with the same brand or generic name
* queryRxImageCode - find images for a medication with a certain rxcui code
* queryRxNormName - find a medication by name
* queryRxNormSpelling - find spelling suggestions for a medication
* queryRxNormApproximate - find a medication by approximate name
* queryRxNormDFG - find a medication by dose form group
* queryMedlinePage - query medlinePlus Connect
* queryRxNormGroup - query dose form groups

### Data Examples
**queryfdaCode**
```javascript
example: https://api.fda.gov/drug/event.json?search=patient.drug.openfda.rxcui:"318272"&count=patient.reaction.reactionmeddrapt.exact
response:
meta: {
        disclaimer: "openFDA is a beta research project and not for clinical use. While we make every effort to ensure that data is accurate, you should assume all results are unvalidated.",
        license: "http://open.fda.gov/license",
        last_updated: "2015-01-21"
    },
    results: [{
            term: "FLUSHING",
            count: 10017
        }, {
            term: "DYSPNOEA",
            count: 9273
        }, {
            term: "NAUSEA",
            count: 9105
        }, {
            term: "DIZZINESS",
            count: 8347
        }
    }]
```

**queryRxImageCode**
```javascript
example: http://rximage.nlm.nih.gov/api/rximage/1/rxnav?rxcui=309114
response:
{
    replyStatus: {
        success: true,
        imageCount: 4,
        totalImageCount: 4,
        date: "2015-04-27 11:03:15 GMT",
        matchedTerms: {
            rxcui: "309114"
        }
    },
    nlmRxImages: [{
            id: 185646439,
            ndc11: "00093-3147-01",
            part: 1,
            relabelersNdc9: [{@
                sourceNdc9: "00093-3147",
                ndc9: [
                    "10544-0020",
                    "35356-0980",
                    "42549-0565",
                    "53808-0222",
                    "55289-0058",
                    "60429-0037",
                    "66116-0255"
                ]
            }],
            status: "Former imprint",
            rxcui: 309114,
            splSetId: "19307ff0-71de-477b-965d-ea243e5ede3a",
            acqDate: "12-02-2009",
            name: "Cephalexin 500 MG Oral Capsule",
            labeler: "Teva Pharmaceuticals USA Inc",
            imageUrl: "http://rximage.nlm.nih.gov/image/images/gallery/original/00093-3147-01_RXNAVIMAGE10_24231258.jpg",
            imageSize: 663359,
            attribution: "National Library of Medicine | Lister Hill National Center for Biomedical Communications | Office of High Performance Computing and Communications | Medicos Consultants LLC"
        }
    }
}
```

**queryRxNormName**
```javascript
example: http://rxnav.nlm.nih.gov/REST/rxcui?name=lipitor
returns: 
 <rxnormdata>
  <idGroup>
      <name>lipitor</name>
      <rxnormId>153165</rxnormId>
  </idGroup>
 </rxnormdata>
```

**queryMedlinePage**
```javascript
example: http://apps2.nlm.nih.gov/medlineplus/services/mpconnect_service.cfm?mainSearchCriteria.v.cs=2.16.840.1.113883.6.88&mainSearchCriteria.v.c=637188&mainSearchCriteria.v.dn=Chantix%200.5%20MG%20Oral%20Tablet&informationRecipient.languageCode.c=en&knowledgeResponseType=application/json
returns:
{
    feed: {
        xsi: "http://www.w3.org/2001/XMLSchema-instance",
        base: "http://www.nlm.nih.gov/medlineplus/",
        lang: "en",
        title: {},
        subtitle: {},
        author: {},
        updated: {},
        category: [],
        id: {},
        entry: [{
            lang: "en",
            title: {
                _value: "Varenicline",
                type: "text"
            },
            link: [{
                title: "Varenicline",
                rel: "alternate",
                type: "html",
                href: "http://www.nlm.nih.gov/medlineplus/druginfo/meds/a606024.html"
            }],
            id: {
                _value: "tag: nlm.nih.gov, 2015-30-04:/medlineplus/druginfo/meds/a606024.html"
            },
            updated: {
                _value: "2015-04-29T22:04:39Z"
            },
            summary: {
                _value: "",
                type: "html"
            }
        }]
    }
}
```
