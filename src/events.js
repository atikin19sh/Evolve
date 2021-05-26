import { global, p_on } from './vars.js';
import { loc } from './locale.js';
import { races } from './races.js';
import { govTitle } from './civics.js';
import { housingLabel, drawTech } from './actions.js';
import { unlockAchieve } from './achieve.js';

export const events = {
    dna_replication: {
        reqs: { 
            race: 'protoplasm',
            resource: 'DNA'
        },
        type: 'major',
        effect(){
            var gain = Math.rand(1,Math.round(global.resource.DNA.max / 3));
            var res = global.resource.DNA.amount + gain;
            if (res > global.resource.DNA.max){ res = global.resource.DNA.max; }
            global.resource.DNA.amount = res;
            return loc('event_dna',[gain.toLocaleString()]);
        }
    },
    rna_meteor: {
        reqs: { 
            race: 'protoplasm',
            resource: 'RNA'
        },
        type: 'major',
        effect(){
            var gain = Math.rand(1,Math.round(global.resource.RNA.max / 2));
            var res = global.resource.RNA.amount + gain;
            if (res > global.resource.RNA.max){ res = global.resource.RNA.max; }
            global.resource.RNA.amount = res;
            return loc('event_rna',[gain.toLocaleString()]);
        }
    },
    inspiration: {
        reqs: { 
            resource: 'Knowledge'
        },
        type: 'major',
        effect(){
            global.race['inspired'] = Math.rand(300,600);
            return loc('event_inspiration');
        }
    },
    fire: {
        reqs: { 
            resource: 'Lumber',
            nogenus: 'aquatic',
            notrait: 'evil'
        },
        type: 'major',
        effect(){
            var loss = Math.rand(1,Math.round(global.resource.Lumber.amount / 4));
            var res = global.resource.Lumber.amount - loss;
            if (res < 0){ res = 0; }
            global.resource.Lumber.amount = res;
            return loc('event_fire',[loss.toLocaleString()]);
        }
    },
    flare: {
        reqs: {
            tech: 'primitive',
        },
        type: 'major',
        condition(){
            return global.city.ptrait === 'flare' ? true : false;
        },
        effect(){
            let at_risk = 0;
            if (global.city.hasOwnProperty('basic_housing')){
                at_risk += global.city.basic_housing.count;
            }
            if (global.city.hasOwnProperty('cottage')){
                at_risk += global.city.cottage.count * 2;
            }
            if (global.city.hasOwnProperty('apartment')){
                at_risk += p_on['apartment'] * 5;
            }
            if (at_risk > global.resource[global.race.species].amount){
                at_risk = global.resource[global.race.species].amount;
            }
            at_risk = Math.floor(at_risk * 0.1);

            let loss = Math.rand(0,at_risk);
            global.resource[global.race.species].amount -= loss;
            global.civic[global.civic.d_job].workers -= loss;
            if (global.civic[global.civic.d_job].workers < 0){
                global.civic[global.civic.d_job].workers = 0;
            }

            if (global.city.biome !== 'oceanic'){
                let time = 400;
                if (global.city.biome === 'forest'){
                    time *= 2;
                }
                else if (global.city.biome === 'desert' || global.city.biome === 'volcanic'){
                    time /= 2;
                }
                global.city['firestorm'] = Math.rand(time,time * 10);
            }

            return loc(global.city.biome === 'oceanic' ? 'event_flare2' : 'event_flare',[races[global.race.species].home, loss.toLocaleString()]);
        }
    },
    raid: {
        reqs: { 
            tech: 'military',
            notech: 'world_control'
        },
        type: 'major',
        condition(){
            return !global.race['cataclysm'] && (global.civic.foreign.gov0.hstl > 60 || global.civic.foreign.gov1.hstl > 60 || global.civic.foreign.gov2.hstl > 60) ? true : false;
        },
        effect(){
            let army = (global.civic.garrison.workers - (global.civic.garrison.wounded / 2)) * global.tech.military;
            let enemy = global['resource'][global.race.species].amount / Math.rand(1,4);
            
            let killed = Math.floor(Math.seededRandom(0,global.civic.garrison.wounded));
            let wounded = Math.floor(Math.seededRandom(global.civic.garrison.wounded,global.civic.garrison.workers));
            global.civic.garrison.workers -= killed;
            global.civic.garrison.wounded += wounded;
            global.stats.died += killed;
            if (global.civic.garrison.wounded > global.civic.garrison.workers){
                global.civic.garrison.wounded = global.civic.garrison.workers;
            }

            if (global.race['frenzy']){
                global.race['frenzy'] += Math.ceil(enemy / 5);
                if (global.race['frenzy'] > 1000000){
                    global.race['frenzy'] = 1000000;
                }
            }

            if (army > enemy){
                return loc('event_raid1',[killed.toLocaleString(),wounded.toLocaleString()]);
            }
            else {
                let loss = Math.rand(1,Math.round(global.resource.Money.amount / 4));
                if (loss <= 0){
                    return loc('event_raid1',[killed.toLocaleString(),wounded.toLocaleString()]);
                }
                else {
                    let res = global.resource.Money.amount - loss;
                    if (res < 0){ res = 0; }
                    global.resource.Money.amount = res;
                    return loc('event_raid2',[loss.toLocaleString(),killed.toLocaleString(),wounded.toLocaleString()]);
                }
            }
        }
    },
    siege: {
        reqs: { 
            tech: 'military',
            notech: 'world_control'
        },
        type: 'major',
        condition(){
            if (global.civic.foreign.gov0.occ || global.civic.foreign.gov1.occ || global.civic.foreign.gov2.occ){
                return false;
            }
            return global.civic.foreign.gov0.hstl > 80 && global.civic.foreign.gov1.hstl > 80 && global.civic.foreign.gov2.hstl > 80 ? true : false;
        },
        effect(){
            let army = (global.civic.garrison.workers - (global.civic.garrison.wounded / 2)) * global.tech.military;
            let enemy = global.civic.foreign.gov0.mil + global.civic.foreign.gov1.mil + global.civic.foreign.gov2.mil;
            
            let killed = Math.floor(Math.seededRandom(0,global.civic.garrison.wounded));
            let wounded = Math.floor(Math.seededRandom(global.civic.garrison.wounded,global.civic.garrison.workers));
            global.civic.garrison.workers -= killed;
            global.civic.garrison.wounded += wounded;
            global.stats.died += killed;
            if (global.civic.garrison.wounded > global.civic.garrison.workers){
                global.civic.garrison.wounded = global.civic.garrison.workers;
            }

            if (global.race['frenzy']){
                global.race['frenzy'] += Math.ceil(enemy / 5);
                if (global.race['frenzy'] > 1000000){
                    global.race['frenzy'] = 1000000;
                }
            }

            if (army > enemy){
                return loc('event_siege1',[killed.toLocaleString(),wounded.toLocaleString()]);
            }
            else {
                var loss = Math.rand(1,Math.round(global.resource.Money.amount / 2));
                var res = global.resource.Money.amount - loss;
                if (res < 0){ res = 0; }
                global.resource.Money.amount = res;
                return loc('event_siege2',[loss.toLocaleString(),killed.toLocaleString(),wounded.toLocaleString()]);
            }
        }
    },
    terrorist: {
        reqs: {
            tech: 'world_control'
        },
        type: 'major',
        effect(){            
            let killed = Math.floor(Math.seededRandom(0,global.civic.garrison.wounded));
            let wounded = Math.floor(Math.seededRandom(global.civic.garrison.wounded,global.civic.garrison.workers));
            global.civic.garrison.workers -= killed;
            global.civic.garrison.wounded += wounded;
            global.stats.died += killed;
            if (global.civic.garrison.wounded > global.civic.garrison.workers){
                global.civic.garrison.wounded = global.civic.garrison.workers;
            }

            if (global.race['frenzy']){
                global.race['frenzy'] += 1000;
                if (global.race['frenzy'] > 1000000){
                    global.race['frenzy'] = 1000000;
                }
            }

            if (killed === 0){
                return loc('event_terrorist1',[wounded.toLocaleString()]);
            }
            else {
                return loc('event_terrorist2',[wounded.toLocaleString(),killed.toLocaleString()]);
            }
        }
    },
    quake: {
        reqs: {
            tech: 'wsc',
            notech: 'quaked'
        },
        type: 'major',
        condition(){
            return global.city.ptrait === 'unstable' ? true : false;
        },
        effect(){
            global.tech['quaked'] = 1;
            drawTech();
            return loc('event_quake',[global.race['cataclysm'] ? races[global.race.species].solar.red : races[global.race.species].home]);
        }
    },
    doom: {
        reqs: {
            tech: 'wsc',
            notech: 'portal_guard'
        },
        type: 'major',
        condition(){
            return global.space['space_barracks'] && global.space.space_barracks.on > 0 ? true : false;
        },
        effect(){
            unlockAchieve('doomed');
            global.stats.portals++;
            return loc(global.race['evil'] ? 'event_doom_alt' : 'event_doom',[races[global.race.species].solar.dwarf]);
        }
    },
    demon_influx: {
        reqs: {
            tech: 'portal_guard'
        },
        type: 'major',
        effect(){
            let surge = Math.rand(2500,5000);
            global.portal.fortress.threat += surge;
            return loc('event_demon_influx',[surge.toLocaleString()]);
        }
    },
    ruins: {
        reqs: { 
            trait: 'ancient_ruins',
            resource: 'Knowledge'
        },
        type: 'major',
        effect(){
            let resources = ['Iron','Copper','Steel','Cement'];
            for (var i = 0; i < resources.length; i++){
                let res = resources[i];
                if (global.resource[res].display){
                    let gain = Math.rand(1,Math.round(global.resource[res].max / 4));
                    if (global.resource[res].amount + gain > global.resource[res].max){
                        global.resource[res].amount = global.resource[res].max;
                    }
                    else {
                        global.resource[res].amount += gain;
                    }
                }
            }
            return loc('event_ruins');
        }
    },
    tax_revolt: {
        reqs: {
            low_morale: 99,
            notrait: 'blissful',
            tech: 'primitive'
        },
        type: 'major',
        condition(){
            return global.civic.govern.type === 'oligarchy' ? global.civic.taxes.tax_rate > 45 : global.civic.taxes.tax_rate > 25;
        },
        effect(){
            return tax_revolt();
        }
    },
    slave_death1: slaveLoss('major','death1'),
    slave_death2: slaveLoss('major','death2'),
    slave_death3: slaveLoss('major','death3'),
    protest: {
        reqs: {
            tech: 'primitive'
        },
        type: 'major',
        condition(){
            return global.civic.govern.type === 'republic' ? true : false;
        },
        effect(){
            global.civic.govern['protest'] = Math.rand(30,60);
            switch(Math.rand(0,10)){
                case 0:
                    return loc('event_protest0',[housingLabel('small')]);
                case 1:
                    return loc('event_protest1');
                case 2:
                    return loc('event_protest2');
                case 3:
                    global.civic.govern['protest'] = Math.rand(45,75);
                    return loc('event_protest3');
                case 4:
                    return loc('event_protest4');
                case 5:
                    global.civic.govern['protest'] = Math.rand(45,75);
                    return loc('event_protest5');
                case 6:
                    return loc('event_protest6');
                case 7:
                    return loc('event_protest7');
                case 8:
                    return loc('event_protest8');
                case 9:
                    global.civic.govern['protest'] = Math.rand(60,90);
                    return loc('event_protest9');
            }
        }
    },
    spy: {
        reqs: {
            tech: 'primitive',
            notech: 'world_control'
        },
        type: 'major',
        condition(){
            if (global.race['elusive']){
                return false;
            }
            for (let i=0; i<3; i++){
                if (global.civic.foreign[`gov${i}`].spy > 0 && !global.civic.foreign[`gov${i}`].occ && !global.civic.foreign[`gov${i}`].anx && !global.civic.foreign[`gov${i}`].buy){
                    return true;
                }
            }
            return false;
        },
        effect(){
            let govs = [];
            for (let i=0; i<3; i++){
                if (global.civic.foreign[`gov${i}`].spy > 0 && !global.civic.foreign[`gov${i}`].occ && !global.civic.foreign[`gov${i}`].anx && !global.civic.foreign[`gov${i}`].buy){
                    govs.push(i);
                }
            }
            let gov = govs[Math.rand(0,govs.length)];
            global.civic.foreign[`gov${gov}`].spy--;
            if (global.civic.foreign[`gov${gov}`].spy === 0) {
                global.civic.foreign[`gov${gov}`].act = 'none';
                global.civic.foreign[`gov${gov}`].sab = 0;
            }
            
            return loc('event_spy',[govTitle(gov)]);
        }
    },
    mine_collapse: {
        reqs: {
            tech: 'mining',
        },
        type: 'major',
        condition(){
            if (global.resource[global.race.species].amount > 0 && global.civic.miner.workers > 0){
                return true;
            }
            return false;
        },
        effect(){
            global.resource[global.race.species].amount--;
            global.civic.miner.workers--;
            return loc('event_mine_collapse');
        }
    },
    slave_escape1: slaveLoss('minor','escape1'),
    slave_escape2: slaveLoss('minor','escape2'),
    slave_escape3: slaveLoss('minor','death4'),
    shooting_star: basicEvent('shooting_star','primitive'),
    tumbleweed: basicEvent('tumbleweed','primitive'),
    flashmob: basicEvent('flashmob','high_tech'),
    heatwave: {
        reqs: {
            tech: 'primitive',
        },
        type: 'minor',
        condition(){
            if (!global.race['cataclysm'] && global.city.calendar.temp !== 2){
                return true;
            }
            return false;
        },
        effect(){
            global.city.calendar.temp = 2;
            global.city.cold = 0;
            return loc('event_heatwave');
        }
    },
    coldsnap: {
        reqs: {
            tech: 'primitive',
        },
        type: 'minor',
        condition(){
            if (!global.race['cataclysm'] && global.city.calendar.temp !== 0){
                return true;
            }
            return false;
        },
        effect(){
            global.city.calendar.temp = 0;
            global.city.hot = 0;
            return loc('event_coldsnap');
        }
    },
    cucumber: basicEvent('cucumber','primitive'),
    planking: basicEvent('planking','high_tech'),
    furryfish: basicEvent('furryfish','primitive'),
    meteor_shower: basicEvent('meteor_shower','primitive'),
    hum: basicEvent('hum','high_tech'),
    bloodrain: basicEvent('bloodrain','primitive'),
    haunting: basicEvent('haunting','science'),
    mothman: basicEvent('mothman','science'),
    dejavu: basicEvent('dejavu','theology'),
    dollar: basicEvent('dollar','currency',function(){
        let cash = Math.rand(1,10);
        global.resource.Money.amount += cash;
        if (global.resource.Money.amount > global.resource.Money.max){
            global.resource.Money.amount = global.resource.Money.max;
        }
        return cash;
    }),
    pickpocket: basicEvent('pickpocket','currency',function(){
        let cash = Math.rand(1,10);
        global.resource.Money.amount -= cash;
        if (global.resource.Money.amount < 0){
            global.resource.Money.amount = 0;
        }
        return cash;
    }),
    bird: basicEvent('bird','primitive'),
    contest: {
        reqs: {
            tech: 'science',
        },
        type: 'minor',
        effect(){
            let place = Math.rand(0,3);
            let contest = Math.rand(0,10);
            return loc('event_contest',[loc(`event_contest_place${place}`),loc(`event_contest_type${contest}`)]);
        }
    },
    cloud: basicEvent('cloud','primitive',function(){
        let type = Math.rand(0,11);
        return loc(`event_cloud_type${type}`);
    }),
    dark_cloud: {
        reqs: {
            tech: 'primitive',
        },
        type: 'minor',
        condition(){
            if (!global.race['cataclysm'] && global.city.calendar.weather !== 0){
                return true;
            }
            return false;
        },
        effect(){
            global.city.calendar.weather = 0;
            return loc('event_dark_cloud');
        }
    },
    gloom: {
        reqs: {
            tech: 'primitive',
        },
        type: 'minor',
        condition(){
            if (!global.race['cataclysm'] && global.city.calendar.weather !== 1){
                return true;
            }
            return false;
        },
        effect(){
            global.city.calendar.weather = 1;
            return loc('event_gloom');
        }
    },
    tracks: basicEvent('tracks','primitive'),
    hoax: basicEvent('hoax','primitive'),
    burial: basicEvent('burial','primitive'),
    artifacts: basicEvent('artifacts','high_tech'),
    parade: basicEvent('parade','world_control'),
    crop_circle: basicEvent('crop_circle','agriculture'),
    llama: basicEvent('llama','primitive',function(){
        let food = Math.rand(25,100);
        global.resource.Food.amount -= food;
        if (global.resource.Food.amount < 0){
            global.resource.Food.amount = 0;
        }
        return food;
    }),
    cat: basicEvent('cat','primitive'),
    omen: basicEvent('omen','primitive'),
    theft: basicEvent('theft','primitive',function(){
        let thief = Math.rand(0,10);
        return loc(`event_theft_type${thief}`);
    }),
    compass: basicEvent('compass','mining'),
    bone: basicEvent('bone','primitive'),
    delicacy: basicEvent('delicacy','high_tech'),
    prank: basicEvent('prank','primitive',function(){
        let prank = Math.rand(0,10);
        return loc(`event_prank_type${prank}`);
    }),
    graffiti: basicEvent('graffiti','science'),
    soul: basicEvent('soul','soul_eater'),
    cheese: {
        reqs: {
            tech: 'banking',
        },
        type: 'minor',
        condition(){
            if (global.tech['banking'] && global.tech.banking >= 7){
                return true;
            }
            return false;
        },
        effect(){
            global.race['cheese'] = Math.rand(10,25);
            return loc(`event_cheese`);
        }
    },
    tremor: basicEvent('tremor','primitive'),
    rumor: basicEvent('rumor','primitive',function(){
        let rumor = Math.rand(0,10);
        return loc(`event_rumor_type${rumor}`);
    }),
};

function basicEvent(title,tech,func){
    return {
        reqs: {
            tech: tech,
        },
        type: 'minor',
        effect(){
            let val = false;
            if (typeof func === 'function'){
                val = func();
            }
            return val ? loc(`event_${title}`,[val]) : loc(`event_${title}`);
        }
    };
}

function slaveLoss(type,string){
    return {
        reqs: { 
            trait: 'slaver',
            tech: 'slaves'
        },
        type: type,
        effect(){
            if (global.city['slave_pen'] && global.city.slave_pen.slaves > 0){
                global.city.slave_pen.slaves--;
                global.resource.Slave.amount = global.city.slave_pen.slaves;
                return loc(`event_slave_${string}`);
            }
            else {
                return loc('event_slave_none');
            }
        }
    };
}

export function eventList(type){
    let event_pool = [];
    Object.keys(events).forEach(function (event){
        let isOk = true;
        if (type !== events[event].type){
            isOk = false;
        }
        if ((type === 'major' && global.event.l === event) || (type === 'minor' && global.m_event.l === event)){
            isOk = false;
        }
        if (events[event]['reqs']){
            Object.keys(events[event].reqs).forEach(function (req) {
                switch(req){
                    case 'race':
                        if (events[event].reqs[req] !== global.race.species){
                            isOk = false;
                        }
                        break;
                    case 'genus':
                        if (events[event].reqs[req] !== races[global.race.species].type){
                            isOk = false;
                        }
                        break;
                    case 'nogenus':
                        if (events[event].reqs[req] === races[global.race.species].type){
                            isOk = false;
                        }
                        break;
                    case 'resource':
                        if (!global.resource[events[event].reqs[req]] || !global.resource[events[event].reqs[req]].display){
                            isOk = false;
                        }
                        break;
                    case 'trait':
                        if (!global.race[events[event].reqs[req]]){
                            isOk = false;
                        }
                        break;
                    case 'notrait':
                        if (global.race[events[event].reqs[req]]){
                            isOk = false;
                        }
                        break;
                    case 'tech':
                        if (!global.tech[events[event].reqs[req]]){
                            isOk = false;
                        }
                        break;
                    case 'notech':
                        if (global.tech[events[event].reqs[req]]){
                            isOk = false;
                        }
                        break;
                    case 'high_tax_rate':
                        if (global.civic.taxes.tax_rate <= [events[event].reqs[req]]){
                            isOk = false;
                        }
                        break;
                    case 'low_morale':
                        if (global.city.morale.current >= [events[event].reqs[req]]){
                            isOk = false;
                        }
                        break;
                    case 'biome':
                        if (global.city.biome !== [events[event].reqs[req]]){
                            isOk = false;
                        }
                        break;
                    default:
                        isOk = false;
                        break;
                }
            });
        }
        if (isOk && events[event]['condition'] && !events[event].condition()){
            isOk = false;
        }
        if (isOk){
            event_pool.push(event);
        }
    });
    return event_pool;
}

function tax_revolt(){
    let special_res = ['Soul_Gem', 'Corrupt_Gem', 'Codex', 'Demonic_Essence', 'Blood_Stone', 'Artifact']
    let ramp = global.civic.govern.type === 'oligarchy' ? 45 : 25;
    let risk = (global.civic.taxes.tax_rate - ramp) * 0.04;
    Object.keys(global.resource).forEach(function (res) {
        if (!special_res.includes(res)){
            let loss = Math.rand(1,Math.round(global.resource[res].amount * risk));
            let remain = global.resource[res].amount - loss;
            if (remain < 0){ remain = 0; }
            global.resource[res].amount = remain;
        }
    });
    return loc('event_tax_revolt');
}
