### This returns all open proposals...

### noOpenProposal
**input**: 2proposal-bothaccepted.trig
**output**: 2proposal-bothaccepted.trig
**test name**: noOpenProposal
*// This is the case where there is no open proposal...(each exist in their own envelope, both are accepted in an agreement)*
 
 output: none
 
 ### oneOpenProposal
**input**: 2proposal-one-accepted.trig
**output**: 2proposal-one-accepted.trig
**test name**:  oneOpenProposal
*// This is the case where there is one open proposal...(each exist in their own envelope, only one is accepted in an agreement)*

**input**:

```
<https://localhost:8443/won/resource/event/6671551888677331000#content> {
    event:6671551888677331000
            won:hasFacet        won:OwnerFacet ;
            won:hasRemoteFacet  won:OwnerFacet ;
            won:hasTextMessage  "hi" .
}

<https://localhost:8443/won/resource/event/5669098069340991000#content> {
    event:5669098069340991000
            won:hasTextMessage  "one" .
}

<https://localhost:8443/won/resource/event/usi9yhill1lo2xi70sjx#content-klsc> {
    event:usi9yhill1lo2xi70sjx
            won:hasTextMessage  "Greetings! \nI am the DebugBot. I can simulate multiple other users so you can test things. I understand a few commands. \nTo see which ones, type \n\n'usage'\n\n (without the quotes)." ;
            agr:proposes event:6671551888677331000 .
}

<https://localhost:8443/won/resource/event/00d5wzbbf8hzzt2eewcc#content-tbn3> {
    event:00d5wzbbf8hzzt2eewcc
            won:hasTextMessage  "I'm not sure I understand you fully." ;
            agr:proposes event:5669098069340991000 .
}

<https://localhost:8443/won/resource/event/557600936467257340#content> {
    event:557600936467257340
            won:hasTextMessage  "two" ;
            agr:accepts event:usi9yhill1lo2xi70sjx .
}
```

**output**:  

  ```
  <https://localhost:8443/won/resource/event/00d5wzbbf8hzzt2eewcc> {
    event:5669098069340991000
            won:hasTextMessage  "one" .
}
 ```

### twoOpenProposals  
**input**: 2proposal-noaccepted.trig
**output**: 2proposal-noaccepted.trig
**test name**: twoOpenProposals   
*// This is the case where there are two open proposals ...(each exist in their own envelope)*

**input**:

```
<https://localhost:8443/won/resource/event/5669098069340991000#content> {
    event:5669098069340991000
            won:hasTextMessage  "one" .
}

<https://localhost:8443/won/resource/event/6671551888677331000#content> {
    event:6671551888677331000
            won:hasFacet        won:OwnerFacet ;
            won:hasRemoteFacet  won:OwnerFacet ;
            won:hasTextMessage  "hi" .
}


<https://localhost:8443/won/resource/event/00d5wzbbf8hzzt2eewcc#content-tbn3> {
    event:00d5wzbbf8hzzt2eewcc
            won:hasTextMessage  "I'm not sure I understand you fully." ;
            agr:proposes event:5669098069340991000 .
}

<https://localhost:8443/won/resource/event/usi9yhill1lo2xi70sjx#content-klsc> {
    event:usi9yhill1lo2xi70sjx
            won:hasTextMessage  "Greetings! \nI am the DebugBot. I can simulate multiple other users so you can test things. I understand a few commands. \nTo see which ones, type \n\n'usage'\n\n (without the quotes)." ;
            agr:proposes event:6671551888677331000 .
}
```

**output**: 

```
<https://localhost:8443/won/resource/event/00d5wzbbf8hzzt2eewcc> {
    <https://localhost:8443/won/resource/event/5669098069340991000>
            <https://w3id.org/won/model#hasTextMessage>
                    "one" .
}

<https://localhost:8443/won/resource/event/usi9yhill1lo2xi70sjx> {
    <https://localhost:8443/won/resource/event/6671551888677331000>
            <https://w3id.org/won/model#hasFacet>
                    <https://w3id.org/won/model#OwnerFacet> ;
            <https://w3id.org/won/model#hasRemoteFacet>
                    <https://w3id.org/won/model#OwnerFacet> ;
            <https://w3id.org/won/model#hasTextMessage>
                    "hi" .
}
```