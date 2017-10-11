const Command = require('command');

module.exports = function boxOpener(dispatch){
	const command = Command(dispatch)
	
	let	hooks = [],
		cid = null,
		enabled = false,
		location = null,
		timer = null,
		delay = 1500,
		statOpened = 0,
		statStarted = null,
		scanning = false;
		boxId = 166901, // MWA box as default.
		inventory = null;
		
	command.add('getbox', () => {
		scanning = true;
		load();
		command.message('Please open the box you wish to set.');
	});
	
	command.add('openbox', () => {
		if(!enabled)
		{
			var d = new Date();
			statStarted = d.getTime();
			enabled = true;
			load();
			command.message('Opening selected box, use the same command to stop.');
			openBox();
		}
		else
		{
			stop();
		}
	});
	
	command.add('stopbox', () => {
		stop();
	});
	
	command.add('boxdelay', (arg) => {
		delay = parseInt(arg);
		command.message("setting box opening delay to " + delay);
    });
	
	dispatch.hook('S_LOGIN', 1, event =>{cid = event.cid});
	
	dispatch.hook('C_PLAYER_LOCATION', 1, event =>{location = event});
	
	function load()
	{
		hook('S_INVEN', 5, event =>{
			if(!enabled) return

			if(event.first) inventory = []
			else if(!inventory) return

			for(let item of event.items) inventory.push(item)

			if(!event.more) 
			{
				let box = false
				for(let item of inventory) 
				{
					if(item.slot < 40) continue 
					if(item.item == boxId)
					{
						box = true
					}
				}
				if(!box) 
				{
					stop();
				}
				inventory.splice(0,inventory.length)
				inventory = [];
				inventory = null
			}
		});
		
		hook('C_USE_ITEM', 1, event =>{
			if(!scanning) return
		
			if(scanning){
				boxId = event.item;
				command.message('Box set to: '+boxId+'');
				scanning = false;
				unload();
			}
		});
		
		hook('S_SYSTEM_MESSAGE_LOOT_ITEM', 1, event => {
			statOpened++;
			clearTimeout(timer);
			openBox();
		});
		
		hook('S_SYSTEM_MESSAGE', 1, event => {
            if(event.message == "@1242")  // SMT_ITEM_MIX_NEED_METERIAL
			{
                stop();
            }
        });
	}
	
	function openBox() 
	{
		dispatch.toServer('C_USE_ITEM', 1, {
			ownerId: cid,
			item: boxId,
			id: 0,
			unk1: 0,
			unk2: 0,
			unk3: 0,
			unk4: 1,
			unk5: 0,
			unk6: 0,
			unk7: 0,
			x: location.x1,
			y: location.y1,
			z: location.z1,
			w: location.w,
			unk8: 0,
			unk9: 0,
			unk10: 0,
			unk11: 1
		});
		
		timer = setTimeout(openBox,delay);
	}
	
	function addZero(i) 
	{
		if (i < 10) {
			i = "0" + i;
		}
		return i;
	}

	function stop() 
	{
		clearTimeout(timer);
		unload();
		enabled = false;
		let d = new Date();
		let t = d.getTime();
		let timeElapsedMSec = t-statStarted;
		d = new Date(1970, 0, 1); // Epoch
		d.setMilliseconds(timeElapsedMSec);
		let h = addZero(d.getHours());
		let m = addZero(d.getMinutes());
		let s = addZero(d.getSeconds());
		command.message('Box opener stopped. Opened: ' + statOpened + ' boxes. Time elapsed: ' + (h + ":" + m + ":" + s) + ". Per box: " + ((timeElapsedMSec / statOpened) / 1000).toPrecision(2) + " sec");
		statOpened = 0;
	}
	
	function unload() {
		if(hooks.length) {
			for(let h of hooks) dispatch.unhook(h)

			hooks = []
		}
	}

	function hook() {
		hooks.push(dispatch.hook(...arguments))
	}
}
