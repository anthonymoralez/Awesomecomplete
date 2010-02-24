describe('Awesomecomplete with static data', function () {
    var mockData = [ { name: 'Oscar Filippelli', email: 'oscar.filippelli@scranton.dundermifflin.com', phone: '(181) 640-7558' },
                     { name: 'Kevin Palmer', email: 'kevin.palmer@yonkers.dundermifflin.com', phone: '(370) 756-3871' },
                     { name: 'Kelly Bratton', email: 'kelly.bratton@yonkers.dundermifflin.com', phone: '(779) 742-2016' } ];

    var text_input = undefined;
    beforeEach(function() {
        text_input = $('<input type=text />');
        text_input.awesomecomplete({staticData: mockData});
    });

    it('should list only items that match when typed', function() {
        text_input.val('yonkers');
        text_input.keyup();
        expect(text_input.data('awesomecomplete-list').children('li').length).toEqual(2);
    });

    it('should list nothing when no items match', function() {
        text_input.val('zzxyxx');
        text_input.keyup();
        expect(text_input.data('awesomecomplete-list').children('li').length).toEqual(0);
    });

    it('should list all items when all items match', function() {
        text_input.val('e');
        text_input.keyup();
        expect(text_input.data('awesomecomplete-list').children('li').length).toEqual(mockData.length);
    });
});
