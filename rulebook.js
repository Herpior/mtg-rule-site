'use strict';

const e = React.createElement;
// I tried to avoid using a public cors proxy but I couldn't get any free host that that I tried to work as a proxy since they are blocking outside connections to prevent spamming and such...
const ruleUrl = "https://api.allorigins.win/get?url=https://media.wizards.com/2021/downloads/MagicCompRules%2020210419.txt";


class SearchBox extends React.Component {
  render(){
    return e(
      'div',
      {id:"search"},
      e(
        'input',
        {type:'text', id:'filter-text', name:'filter-text', onChange:()=>this.props.onEdit(event.target.value)}
      )
    );
  }
}

class Rule extends React.Component {
  renderRule(){
    const delim = "rule "
    let parts = this.props.rule.split(delim);
    let res = [parts[0]]
    for(let i = 1; i<parts.length; i++){
      let numstr = parts[i].slice(0,3);
      if(isNaN(numstr)){
        last = res[res.length];
        res[res.length] = last + delim + parts[i];
      }
      else {
        let number = Number(numstr);
        let chapter = this.props.tocNumbers[number];
        let link = e("a", {onClick: () => this.props.changeChapter(chapter), key:numstr+"-"+1}, numstr)
        res.push(delim)
        res.push(link);
        res.push(parts[i].slice(3,parts[i].length));
      }
    }
    return res;
  }
  render(){
    return e(
      'p',
      {},
      this.renderRule()
    );
  }
}

class RuleDisplay extends React.Component {
  render(){
    return e(
      'div',
      {id:"rules"},
      this.props.rules[this.props.currentChapter]
        .filter((rule)=>this.props.filter=="" || rule.includes(this.props.filter))
        .map((rule, index) => e(Rule, {
          key: "rules-"+index+"-"+rule,
          rule:rule,
          tocNumbers:this.props.tocNumbers,
          changeChapter: this.props.changeChapter
        }))
    );
  }
}
class Chapter extends React.Component {
  render(){
    return e(
      'li',
      {id: this.props.chapter},
      e(
        'button',
        {onClick: this.props.onClick},
        this.props.chapter
      )
    );
  }
}

class ChapterCategory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  render(){
    let header = e(
        'li',
        {id:this.props.heading, key:this.props.heading},
        e(
          'button',
          {onClick: ()=>this.setState({open: !this.state.open})},
          this.props.heading
        ))
    if(!this.state.open){
      return header
    }
    else return [header, e("ul", {key:"ul-"+this.props.heading}, this.props.chapters.map(
      (chapter)=>e(Chapter, {
        key: chapter,
        chapter: chapter,
        onClick:()=>this.props.onClick(chapter)
      })))];
  }
}

class TableOfContents extends React.Component {
  render(){
    let tocChapters = Object.keys(this.props.tocHeadings).map(
      (header) => e(ChapterCategory, {
        key: header,
        heading: header,
        chapters: this.props.tocHeadings[header],
        onClick: this.props.onClick,
      }));
    let tocExtras = this.props.tocExtras.map((chapter)=>e(Chapter, {
        key: chapter,
        chapter: chapter,
        onClick:()=>this.props.onClick(chapter)
      }));
    return e('ul', {id: "toc-ul"}, tocChapters);//.concat(tocExtras));
  }
}

class Rulebook extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      rawText: "Not loaded",
      tocChapters: [],
      tocHeadings: {},
      tocNumbers: {},
      tocExtras: [],
      intro: "Not Loaded.",
      rules: {},
      glossary: {},
      filter: "",
      currentChapter: "",
    };
  }

/* assuming the rules file has some introduction first,
   then a line with the text "Contents"
   after which numbered chapters starting from 1 are listed.
   the last line of ToC is before the first item in the contents appears for the second time
   I could ignore glossary and credits though
   otoh I could add a glossary highlight thing
*/
  parseRules(rawText) {
    // let's get the lines with text in them
    const lines = rawText.split("\r\n")
                  .map(line => line.trim())
                  .filter(line => line.length>=1);
    // skip the introduction
    let i = 0;
    while(i<lines.length && lines[i] != "Contents"){
      i += 1;
    }
    let intro = lines.splice(0, i);
    // reset index and skip the Contents line
    i = 1;
    // go through the items in the toc until the first item is seen again
    let start = i;
    i += 1;
    while(i<lines.length && lines[i] != lines[start]){
      i += 1;
    }
    let end = i;
    // split the toc into their own array
    let toc_lines = lines.splice(start, end-start);
    // js splice edits the original array so move the index back the same amount
    i = start;
    // now let's collect the rules into an object
    // and while we're here, let's collect the chapter name and number mappings
    // and header relations
    let chapters = {};
    let tocHeadings = {};
    let tocNumbers = {};
    let headingNro = 0;
    let heading = "0";
    for(let j = 0; j<toc_lines.length;j++){
      let ch_start = i;
      // take lines until the title for the next chapter is seen
      while (i<lines.length && lines[i] != toc_lines[(j+1)%toc_lines.length]){ //using mod to avoid iob exception in the credits
        i += 1;
      }
      let ch_end = i;
      let ch_num = toc_lines[j].split('.')[0];
      if(ch_num < 100){
        headingNro = Number(ch_num);
        heading = toc_lines[j]
        tocNumbers[headingNro] = heading;
        tocHeadings[heading] = [];
      } else if (ch_num>=100*headingNro && ch_num<100*(headingNro+1)){
        tocNumbers[Number(ch_num)] = toc_lines[j];
        tocHeadings[heading].push(toc_lines[j]);
      }
      // add them into the object for easy access
      chapters[toc_lines[j]] = lines.splice(ch_start, ch_end-ch_start);
      // reset the i again
      i = ch_start;
    }
    let extras = toc_lines.filter((line)=>!(line.split('.')[0]<1e9));
    chapters["Introduction"] = intro;
    let glossary = {};
    try {
      glossary = this.parseGlossary(chapters["Glossary"]);
    }
    catch (err) {
      console.log("Failed to read glossary.");
    }
    return {
      tocChapters: toc_lines,
      tocHeadings: tocHeadings,
      tocNumbers: tocNumbers,
      tocExtras: extras,
      rules: chapters,
      glossary: glossary,
    };
  }

  parseGlossary(lines){
    let glossary = {};
    for(let i = 1; i*2<lines.length; i+=2){
      glossary[lines[i-1]] = lines[i];
    }
    return glossary;
  }

  loadRules(url) {
    fetch(ruleUrl, {mode: 'cors'}).then((response)=>{
      if (response.ok) return response.json();
    }).then(data =>{
      let ruleObj = this.parseRules(data.contents);
      this.setState({
        loaded: true,
        rawText: data.contents,
        tocChapters: ruleObj.tocChapters,
        tocHeadings: ruleObj.tocHeadings,
        tocNumbers: ruleObj.tocNumbers,
        tocExtras: ruleObj.tocExtras,
        intro: ruleObj.introduction,
        rules: ruleObj.rules,
        filter: this.state.filter,
        glossary: ruleObj.glossary,
        currentChapter: "Introduction",
      });
    }).catch((err) => {
      this.editState("rawText", "Failed to load file.");
      console.log('fetch error', err);
    });
  }

  editState(key, value){
    let clone = Object.assign({}, this.state);
    clone[key] = value;
    this.setState(clone);
  }

  componentDidMount() {
    this.loadRules(ruleUrl);
  }

  render() {
    if (!this.state.loaded) {
      return this.state.rawText;
    }

    return e(
      'div',
      { id: "rule_columns" },
      e(
        'div',
        {id:'left-side'},
        e(SearchBox, {
          onEdit: (content) => this.editState('filter', content)
        }),
        e(TableOfContents, {
          tocChapters: this.state.tocChapters,
          tocHeadings: this.state.tocHeadings,
          tocNumbers: this.state.tocNumbers,
          tocExtras: this.state.tocExtras,
          onClick: (chapter) => this.editState('currentChapter', chapter)
        })
      ),
      e(RuleDisplay, {
        currentChapter: this.state.currentChapter,
        filter: this.state.filter,
        tocNumbers: this.state.tocNumbers,
        rules: this.state.rules,
        glossary: this.state.glossary,
        changeChapter: (chapter) => this.editState('currentChapter', chapter)
      })
    );
  }
}

const domContainer = document.querySelector('#rule_app_container');
ReactDOM.render(e(Rulebook), domContainer);
