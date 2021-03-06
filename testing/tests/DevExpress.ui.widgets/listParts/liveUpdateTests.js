import $ from "jquery";
import { DataSource } from "data/data_source/data_source";

import "ui/list";

QUnit.module("live update", {
    beforeEach: function() {
        this.itemRenderedSpy = sinon.spy();
        this.itemDeletedSpy = sinon.spy();
        this.createList = (options) => {
            return $("#templated-list").dxList($.extend({
                dataSource: {
                    paginate: false,
                    pushAggregationTimeout: 0,
                    load: () => [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }],
                    key: "id"
                },
                onContentReady: (e) => {
                    e.component.option("onItemRendered", this.itemRenderedSpy);
                    e.component.option("onItemDeleted", this.itemDeletedSpy);
                }
            }, options)).dxList("instance");
        };
    }
}, function() {
    QUnit.test("update item", function(assert) {
        var list = this.createList(),
            store = list.getDataSource().store();

        var pushData = [{ type: "update", data: { a: "Item 0 Updated", id: 0 }, key: 0 }];
        store.push(pushData);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after push");
        assert.equal(list.itemElements().length, 2, "check items elements count");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData, pushData[0].data, "check updated item");
    });

    QUnit.test("insert item", function(assert) {
        var store = this.createList().getDataSource().store();

        var pushData = [{ type: "insert", data: { a: "Item 2 Inserted", id: 2 } }];
        store.push(pushData);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after push");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData, pushData[0].data, "check added item");
    });

    QUnit.test("insert item to specific position", function(assert) {
        var store = this.createList().getDataSource().store();

        var pushData = [{ type: "insert", data: { a: "Item 2 Inserted", id: 2 }, index: 1 }];
        store.push(pushData);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after push");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData, pushData[0].data, "check added item");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemIndex, pushData[0].index, "check added index");
    });

    QUnit.test("insert item to specific position and update", function(assert) {
        var list = this.createList(),
            store = list.getDataSource().store();

        var pushData = [{ type: "insert", data: { a: "Item 2 Inserted", id: 2 }, index: 0 }];
        store.push(pushData);

        assert.equal(this.itemRenderedSpy.firstCall.args[0].itemIndex, 0, "index");
        assert.equal($(this.itemRenderedSpy.firstCall.args[0].itemElement).get(0), list.itemElements()[0]);

        store.push([{ type: "update", data: { a: "Item 2 Updated", id: 2 }, key: 2 }]);

        assert.equal(this.itemRenderedSpy.callCount, 2, "insert & update");
        assert.equal(this.itemRenderedSpy.lastCall.args[0].itemIndex, 0, "index");
        assert.equal($(this.itemRenderedSpy.lastCall.args[0].itemElement).get(0), list.itemElements()[0]);
        assert.equal(list.itemElements().length, 3, "check items elements count");
    });

    QUnit.test("remove one item", function(assert) {
        var list = this.createList(),
            store = list.getDataSource().store();

        var pushData = [{ type: "remove", key: 0 }];
        store.push(pushData);

        assert.equal(this.itemRenderedSpy.callCount, 0, "items are not refreshed after remove");
        assert.equal(list.option("items").length, 1);
        assert.deepEqual(this.itemDeletedSpy.callCount, 1, "check removed items count");
        assert.deepEqual(this.itemDeletedSpy.firstCall.args[0].itemData.id, pushData[0].key, "check removed item key");
    });

    QUnit.test("remove two items", function(assert) {
        var store = this.createList({
            dataSource: {
                paginate: false,
                pushAggregationTimeout: 0,
                load: () => [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }, { a: "Item 3", id: 2 }],
                key: "id"
            }
        }).getDataSource().store();

        var pushData = [{ type: "remove", key: 0 }, { type: "update", data: { a: "Item 2 Updated", id: 2 }, key: 2 }];
        store.push(pushData);

        assert.equal(this.itemRenderedSpy.callCount, 1, "items are not refreshed after remove");
        assert.deepEqual(this.itemDeletedSpy.callCount, 1, "check removed items count");
        assert.deepEqual(this.itemDeletedSpy.firstCall.args[0].itemData.id, pushData[0].key, "check removed item key");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.id, pushData[1].key, "check updated item key");
    });

    QUnit.test("update item when grouping is enabled", function(assert) {
        var store = this.createList({
            dataSource: {
                load: () => [{
                    key: "a",
                    items: [{ a: "Item 0", id: 0, type: "a" }, { a: "Item 2", id: 0, type: "a" }]
                }, {
                    key: "b",
                    items: [{ a: "Item 1", id: 1, type: "b" }]
                }],
                pushAggregationTimeout: 0,
                key: "id",
                group: "type"
            },
            grouped: true
        }).getDataSource().store();

        var pushData = [{ type: "update", data: { a: "Item 0 Updated", id: 0, type: "a" }, key: 0 }];
        store.push(pushData);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after push");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData, pushData[0].data, "check updated item");
    });

    QUnit.test("update item when paging is enabled", function(assert) {
        var list = this.createList({
                pageLoadMode: "nextButton",
                dataSource: {
                    paginate: true,
                    pageSize: 2,
                    pushAggregationTimeout: 0,
                    key: "id",
                    load: (loadOptions) => {
                        if(loadOptions.skip > 0) {
                            return [{ a: "Item 2", id: 2 }, { a: "Item 3", id: 3 }];
                        }
                        return [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
                    }
                }
            }),
            store = list.getDataSource().store();

        var $moreButton = $("#templated-list .dx-list-next-button > .dx-button").eq(0);
        $moreButton.trigger("dxclick");

        this.itemRenderedSpy.reset();
        var pushData = [
            { type: "update", data: { a: "Item 0 Updated", id: 0 }, key: 0 },
            { type: "update", data: { a: "Item 2 Updated", id: 2 }, key: 2 },
        ];
        store.push(pushData);

        assert.equal(this.itemRenderedSpy.callCount, 2, "items from different pages are updated after push");
        assert.equal(list.itemElements().length, 4, "check items elements count");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData, pushData[0].data, "check first updated item");
        assert.deepEqual(this.itemRenderedSpy.lastCall.args[0].itemData, pushData[1].data, "check last updated item");
    });

    QUnit.test("push & repaintChangesOnly", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var list = this.createList({
                dataSource: {
                    paginate: false,
                    load: () => data,
                    pushAggregationTimeout: 0,
                    key: "id"
                },
                repaintChangesOnly: true
            }),
            dataSource = list.getDataSource();

        var pushData = [
            { type: "insert", data: { a: "Item Inserted", id: 2 }, index: 1 },
        ];
        dataSource.store().push(pushData);
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Inserted");

        data[0] = { a: "Item Updated", id: 0 };
        dataSource.load();

        assert.equal(this.itemRenderedSpy.callCount, 2);
        assert.equal(list.itemElements().length, 3, "check items elements count");
        assert.deepEqual(this.itemRenderedSpy.lastCall.args[0].itemData.a, "Item Updated");
    });

    QUnit.test("repaintChangesOnly, update item instance", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var dataSource = this.createList({
            dataSource: {
                load: () => data,
                key: "id"
            },
            repaintChangesOnly: true
        }).getDataSource();

        data[0] = { a: "Item Updated", id: 0 };
        dataSource.load();

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after reload");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Updated", "check updated item");
    });

    QUnit.test("repaintChangesOnly, update item field", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var dataSource = this.createList({
            dataSource: {
                load: () => data,
                key: "id"
            },
            repaintChangesOnly: true
        }).getDataSource();

        data[0].a = "Item Updated";
        dataSource.load();

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after reload");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Updated", "check updated item");
    });

    QUnit.test("repaintChangesOnly, grouping, update", function(assert) {
        var data = [{
            key: "a",
            items: [{ a: "Item 0", id: 0, type: "a" }, { a: "Item 2", id: 1, type: "a" }]
        }, {
            key: "b",
            items: [{ a: "Item 1", id: 2, type: "b" }]
        }];
        var dataSource = this.createList({
            dataSource: {
                load: () => data,
                key: "id",
                group: "type"
            },
            grouped: true,
            repaintChangesOnly: true
        }).getDataSource();

        data[0].items[0].a = "Item Updated";
        dataSource.load();

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after reload");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Updated", "check updated item");
    });

    QUnit.test("repaintChangesOnly, update dataSource", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item Updated", id: 1 }];
        var list = this.createList({
            dataSource: {
                load: () => [data[0]],
                key: "id"
            },
            repaintChangesOnly: true
        });

        var dataSource = new DataSource({
            paginate: false,
            load: () => data,
            key: "id"
        });
        list.option("dataSource", dataSource);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after reload");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Updated", "check updated item");
    });

    QUnit.test("repaintChangesOnly, remove dataSource", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item Updated", id: 1 }];
        var list = this.createList({
            dataSource: {
                load: () => [data[0]],
                key: "id"
            },
            repaintChangesOnly: true
        });

        list.option("dataSource", null);

        assert.equal(list.option("items").length, 0, "items are cleared");
    });

    QUnit.test("repaintChangesOnly, update store item", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var dataSource = this.createList({
            dataSource: {
                load: () => data,
                key: "id",
                update: (key, value) => data[0].a = value.a
            },
            repaintChangesOnly: true
        }).getDataSource();

        dataSource.store().update(0, { a: "Item Updated", id: 0 });
        dataSource.load();

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after reload");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Updated", "check updated item");
    });

    QUnit.test("repaintChangesOnly, update item", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var list = this.createList({
            dataSource: null,
            items: data,
            keyExpr: "id",
            repaintChangesOnly: true
        });

        data[0] = { a: "Item Updated", id: 0 };
        list.option("items", data);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after reload");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Updated", "check updated item");
    });

    QUnit.test("repaintChangesOnly, insert item without key", function(assert) {
        var data = [{ a: "Item 0" }, { a: "Item 1" }];
        var list = this.createList({
            dataSource: null,
            items: data,
            repaintChangesOnly: true
        });

        data.push({ a: "Item Inserted" });
        list.option("items", data);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after insert");
        assert.equal(list.itemElements().length, 3, "check items elements count");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Inserted", "check inserted item");
    });

    QUnit.test("repaintChangesOnly, add item without key", function(assert) {
        var data = [{ a: "Item 0" }, { a: "Item 1" }];
        var list = this.createList({
            dataSource: null,
            items: data,
            repaintChangesOnly: true
        });

        data.push({ a: "Item Added" });
        list.option("items", data);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after reload");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Added", "check added item");
    });

    QUnit.test("repaintChangesOnly, add item to specific position", function(assert) {
        var data = [{ a: "Item 0" }, { a: "Item 1" }];

        var list = this.createList({
            dataSource: null,
            items: data,
            repaintChangesOnly: true
        });

        data.splice(1, 0, { a: "Item Added" });
        list.option("items", data);

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after push");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData, data[1], "check added item");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemIndex, 1, "check added index");
    });

    QUnit.test("repaintChangesOnly, delete item", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var dataSource = this.createList({
            dataSource: {
                load: () => data,
                key: "id"
            },
            repaintChangesOnly: true
        }).getDataSource();

        data.splice(0, 1);
        dataSource.load();

        assert.equal(this.itemRenderedSpy.callCount, 0, "no updated items");
        assert.equal(this.itemDeletedSpy.callCount, 1, "one item is deleted");
        assert.deepEqual(this.itemDeletedSpy.firstCall.args[0].itemData.a, "Item 0", "check deleted item");
    });

    QUnit.test("repaintChangesOnly, add item", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var dataSource = this.createList({
            dataSource: {
                load: () => data,
                key: "id",
                pushAggregationTimeout: 0
            },
            repaintChangesOnly: true
        }).getDataSource();

        data.push({ a: "Item 2", id: 2 });
        dataSource.load();

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is rendered after append");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item 2", "check appended item");
    });

    QUnit.test("repaintChangesOnly, add item in the beginning (dataSource)", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var dataSource = this.createList({
            dataSource: {
                load: () => data,
                key: "id",
                pushAggregationTimeout: 0
            },
            repaintChangesOnly: true
        }).getDataSource();

        data.unshift({ a: "Item 2", id: 2 });
        dataSource.load();

        assert.equal(this.itemDeletedSpy.callCount, 0, "only one item is rendered after append");
        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is rendered after append");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item 2", "check appended item");
    });

    QUnit.test("repaintChangesOnly, add item in the beginning (items)", function(assert) {
        var data = [{ a: "Item 0", id: 0 }, { a: "Item 1", id: 1 }];
        var list = this.createList({
            items: data,
            keyExpr: "id",
            repaintChangesOnly: true
        });

        data.unshift({ a: "Item 2", id: 2 });
        list.option("items", data);

        assert.equal(this.itemDeletedSpy.callCount, 0, "only one item is rendered after append");
        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is rendered after append");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item 2", "check appended item");
    });

    QUnit.test("repaintChangesOnly, update item instance with composite key", function(assert) {
        var data = [{ a: "Item 0", id: 0, key: 1 }, { a: "Item 1", id: 0, key: 0 }];
        var dataSource = this.createList({
            dataSource: {
                load: () => data,
                key: ["id", "key"]
            },
            repaintChangesOnly: true
        }).getDataSource();

        data[0] = { a: "Item Updated", id: 0, key: 1 };
        dataSource.load();

        assert.equal(this.itemRenderedSpy.callCount, 1, "only one item is updated after reload");
        assert.deepEqual(this.itemRenderedSpy.firstCall.args[0].itemData.a, "Item Updated", "check updated item");
    });

    QUnit.test("onContentReady called after push", function(assert) {
        var contentReadySpy = sinon.spy();
        var list = this.createList({
                onContentReady: contentReadySpy
            }),
            store = list.getDataSource().store();

        var pushData = [{ type: "insert", data: { a: "Item 2 Inserted", id: 2 } }];
        store.push(pushData);

        assert.equal(contentReadySpy.callCount, 2);
    });
});
