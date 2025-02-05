'use strict';
'require form';
'require poll';
'require rpc';
'require view';
'require fs';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('vlmcsd'), {}).then(function (res) {
		return res?.['vlmcsd']?.['instances']?.['vlmcsd']?.['running'];
	});
}

function renderStatus(status) {
	const color = status? 'green' :'red';
	const service = _('Vlmcsd KMS Server');
	const running = status? _('RUNNING') : _('NOT RUNNING');
	const spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';
	return spanTemp.format(color, service, running);
}

return view.extend({
	render: function () {
		let m, s, o;

		m = new form.Map('vlmcsd', _('Vlmcsd KMS Server'));

		s = m.section(form.TypedSection);
		s.anonymous = true;
		s.render = function () {
			poll.add(function () {
				return L.resolveDefault(getServiceStatus()).then(function (status) {
					const stats = renderStatus(status);
					const view = document.getElementById('vlmcsd_status');
					view.innerHTML = stats;
				});
			});

			return E('div', { class: 'cbi-section', id: 'status_bar' }, [
				E('p', { id: 'vlmcsd_status' }, _('Collecting data…'))
			]);
		}

		s = m.section(form.NamedSection, 'config', 'vlmcsd');
		s.tab('general', _('General Settings'));
		s.tab('config_file', _('Configuration File'), _('Edit the content of the /etc/vlmcsd.ini file.'));

		o = s.taboption('general', form.Flag, 'enabled', _('Enable Vlmcsd Service'));
		o = s.taboption('general', form.Flag, 'auto_activate', _('Auto Activate'));
		o = s.taboption('general', form.Flag, 'internet_access', _('Allow Internet Access'));

		o = s.taboption('config_file', form.TextValue, '_tmpl',
			null,
			_("This is the content of the file '/etc/vlmcsd.ini', you can edit it here, usually no modification is needed."));
		o.rows = 20;
		o.cfgvalue = function (section_id) {
			return fs.trimmed('/etc/vlmcsd.ini');
		};
		o.write = function (section_id, formvalue) {
			return fs.write('/etc/vlmcsd.ini', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
		};

		return m.render();
	}
});
